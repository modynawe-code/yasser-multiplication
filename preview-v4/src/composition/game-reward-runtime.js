import { gameEventBus } from '../modules/games/core/game-event-bus.js';
import { REWARD_CATALOG } from '../shared/rewards/reward-catalog.js';
import { createRewardCatalogRegistry } from '../shared/rewards/reward-catalog-registry.js';
import { createRewardRuleRegistry } from '../shared/rewards/reward-rule-registry.js';
import { createEventRewardService } from '../shared/rewards/event-reward-service.js';
import { createGameRewardProgressTracker } from '../shared/rewards/game-reward-progress-tracker.js';
import { createGameProgressionService } from '../shared/progress/game-progression-service.js';
import { createEncouragementRegistry } from '../shared/encouragement/encouragement-registry.js';
import { createCharacterStateRegistry } from '../shared/ui/character-state-registry.js';
import { MASHAAL_REWARD_CATALOG,MASHAAL_REWARD_CATALOG_ID } from '../modules/mashaal/rewards/mashaal-reward-catalog.js';
import { MASHAAL_REWARD_RULES } from '../modules/mashaal/rewards/mashaal-reward-rules.js';
import { MASHAAL_ENCOURAGEMENT_PACK } from '../modules/mashaal/encouragement/mashaal-encouragement-pack.js';
import { MASHAAL_CHARACTER_STATE_PACK } from '../modules/mashaal/ui/mashaal-character-state-pack.js';

const FAMILY_ACADEMIC_GAME_CATALOG_ID='family-academic-game';
function academicGameRules(learnerId){
  return Object.freeze([
    Object.freeze({
      id:'game-participation-reward',
      rewardId:'progress-badge',
      eventTypes:Object.freeze(['game.completed']),
      when:(_event,context)=>Number(context?.rewardProgress?.completions||0)>=3,
      awardKey:()=>`${learnerId}:games:3-completions:progress-badge`
    })
  ]);
}
function broadcastReward(event,result){
  if(typeof globalThis.dispatchEvent!=='function'||typeof globalThis.CustomEvent!=='function')return;
  try{globalThis.dispatchEvent(new globalThis.CustomEvent('family:reward-unlocked',{detail:Object.freeze({learnerId:event?.learnerId,event,result})}));}catch{}
}

export function createFamilyGameRewardRuntime({repository,eventBus=gameEventBus,onReward=null,progressStorage=globalThis.localStorage,progressionStorage=progressStorage}={}){
  if(!repository?.load||!repository?.save)throw new TypeError('reward repository is required');
  if(!eventBus?.subscribe)throw new TypeError('game event bus is required');

  const catalogs=createRewardCatalogRegistry();
  catalogs.register(MASHAAL_REWARD_CATALOG_ID,MASHAAL_REWARD_CATALOG);
  catalogs.register(FAMILY_ACADEMIC_GAME_CATALOG_ID,REWARD_CATALOG);
  const rules=createRewardRuleRegistry();
  rules.register('mashaal',{mode:'developmental',rules:MASHAAL_REWARD_RULES});
  rules.register('yasser',{mode:'academic',rules:academicGameRules('yasser')});
  rules.register('khaled',{mode:'academic',rules:academicGameRules('khaled')});
  const encouragement=createEncouragementRegistry();
  encouragement.register('mashaal',MASHAAL_ENCOURAGEMENT_PACK);
  const characterStates=createCharacterStateRegistry();
  characterStates.register('mashaal',MASHAAL_CHARACTER_STATE_PACK);
  const rewardProgress=createGameRewardProgressTracker({storage:progressStorage||null});
  const progression=createGameProgressionService({storage:progressionStorage||null});
  const rewards=createEventRewardService({repository,ruleRegistry:rules,catalogRegistry:catalogs});

  function enrichedSummary(learnerId){
    return Object.freeze({...rewards.getSummary(learnerId),progress:rewardProgress.get(learnerId),progression:progression.get(learnerId)});
  }

  function handle(event){
    const progress=rewardProgress.record(event);
    const gameProgression=progression.record(event);
    const baseResult=rewards.handle(event,{context:{rewardProgress:progress,gameProgression}});
    const result=Object.freeze({...baseResult,summary:Object.freeze({...baseResult.summary,progress,progression:gameProgression})});
    if(result.added>0){
      broadcastReward(event,result);
      if(typeof onReward==='function'){
        const cue=encouragement.resolve(event.learnerId,'reward');
        const characterState=characterStates.resolve(event.learnerId,cue?.characterState);
        try{onReward(Object.freeze({event,result,cue,characterState}));}catch{}
      }
    }
    return result;
  }

  const unsubscribe=eventBus.subscribe(handle);
  return Object.freeze({
    stop(){unsubscribe?.();},
    handle,
    getSummary:enrichedSummary,
    getProgress:rewardProgress.get,
    getProgression:progression.get,
    resolveEncouragement:encouragement.resolve,
    catalogs,
    rules,
    characterStates
  });
}
