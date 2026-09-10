import { gameEventBus } from '../modules/games/core/game-event-bus.js';
import { createRewardCatalogRegistry } from '../shared/rewards/reward-catalog-registry.js';
import { createRewardRuleRegistry } from '../shared/rewards/reward-rule-registry.js';
import { createEventRewardService } from '../shared/rewards/event-reward-service.js';
import { createEncouragementRegistry } from '../shared/encouragement/encouragement-registry.js';
import { MASHAAL_REWARD_CATALOG,MASHAAL_REWARD_CATALOG_ID } from '../modules/mashaal/rewards/mashaal-reward-catalog.js';
import { MASHAAL_REWARD_RULES } from '../modules/mashaal/rewards/mashaal-reward-rules.js';
import { MASHAAL_ENCOURAGEMENT_PACK } from '../modules/mashaal/encouragement/mashaal-encouragement-pack.js';

export function createFamilyGameRewardRuntime({repository,eventBus=gameEventBus,onReward=null}={}){
  if(!repository?.load||!repository?.save)throw new TypeError('reward repository is required');
  if(!eventBus?.subscribe)throw new TypeError('game event bus is required');

  const catalogs=createRewardCatalogRegistry();
  catalogs.register(MASHAAL_REWARD_CATALOG_ID,MASHAAL_REWARD_CATALOG);
  const rules=createRewardRuleRegistry();
  rules.register('mashaal',{mode:'developmental',rules:MASHAAL_REWARD_RULES});
  const encouragement=createEncouragementRegistry();
  encouragement.register('mashaal',MASHAAL_ENCOURAGEMENT_PACK);
  const rewards=createEventRewardService({repository,ruleRegistry:rules,catalogRegistry:catalogs});

  function handle(event){
    const result=rewards.handle(event);
    if(result.added>0&&typeof onReward==='function'){
      const cue=encouragement.resolve(event.learnerId,'reward');
      try{onReward(Object.freeze({event,result,cue}));}catch{}
    }
    return result;
  }

  const unsubscribe=eventBus.subscribe(handle);
  return Object.freeze({
    stop(){unsubscribe?.();},
    handle,
    getSummary:rewards.getSummary,
    resolveEncouragement:encouragement.resolve,
    catalogs,
    rules
  });
}
