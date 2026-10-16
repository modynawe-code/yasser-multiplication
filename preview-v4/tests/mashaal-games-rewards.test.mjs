import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { createInitialKhaledState } from '../src/modules/khaled/domain/state-model.js';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { createPlayerContext } from '../src/modules/games/core/player-context.js';
import { createGameLearningAdapter } from '../src/modules/games/learning/game-learning-providers.js';
import { createMashaalGameLearningProvider } from '../src/modules/mashaal/application/game-learning-provider.js';
import { MASHAAL_REWARD_CATALOG,MASHAAL_REWARD_CATALOG_ID } from '../src/modules/mashaal/rewards/mashaal-reward-catalog.js';
import { MASHAAL_REWARD_RULES } from '../src/modules/mashaal/rewards/mashaal-reward-rules.js';
import { MASHAAL_ENCOURAGEMENT_PACK } from '../src/modules/mashaal/encouragement/mashaal-encouragement-pack.js';
import { createRewardCatalogRegistry } from '../src/shared/rewards/reward-catalog-registry.js';
import { createRewardRuleRegistry } from '../src/shared/rewards/reward-rule-registry.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createEventRewardService } from '../src/shared/rewards/event-reward-service.js';
import { createEncouragementRegistry } from '../src/shared/encouragement/encouragement-registry.js';
import { createGameEvent } from '../src/modules/games/core/game-event-contract.js';

function memoryStorage(){
  const values=new Map();
  return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('Mashaal game learning plugs into the generic adapter without editing its core contract',async()=>{
  const yasser=createInitialState(),khaled=createInitialKhaledState(),mashaal=createInitialMashaalState();
  let mashaalSaves=0;
  const mashaalProvider=createMashaalGameLearningProvider({getState:()=>mashaal,saveState:()=>{mashaalSaves+=1;},random:()=>0,now:()=>12345});
  const adapter=createGameLearningAdapter({getYasserState:()=>yasser,getKhaledState:()=>khaled,additionalProviders:{mashaal:mashaalProvider},random:()=>0});
  assert.equal(adapter.supports('mashaal'),true);
  const player=createPlayerContext({playerId:'mashaal',learnerId:'mashaal',displayName:'مشاعل'});
  const challenge=await adapter.nextChallenge(player,{gameId:'xo'});
  assert.equal(challenge.kind,'kg3-choice');
  assert.equal(challenge.visual.kind,'mashaal-activity');
  assert.ok(challenge.options.includes(challenge.correctAnswer));
  const before=mashaal.evidenceLog.length;
  const evidence=await adapter.recordChallenge(player,{challenge,answer:challenge.correctAnswer,responseMs:800});
  assert.ok(evidence);
  assert.equal(mashaal.evidenceLog.length,before+1);
  assert.equal(mashaalSaves,1);
});

test('additional learner providers cannot replace established Yasser or Khaled providers',()=>{
  assert.throws(()=>createGameLearningAdapter({getYasserState:()=>createInitialState(),getKhaledState:()=>createInitialKhaledState(),additionalProviders:{yasser:{nextChallenge(){return{};}}}}),/already configured/);
});

test('Mashaal developmental catalog exposes basic and premium rewards with visible requirements',()=>{
  assert.equal(MASHAAL_REWARD_CATALOG.length,22);
  assert.equal(new Set(MASHAAL_REWARD_CATALOG.map(item=>item.id)).size,22);
  assert.equal(new Set(MASHAAL_REWARD_CATALOG.map(item=>item.graphicKey)).size,22);
  assert.equal(MASHAAL_REWARD_CATALOG.filter(item=>item.tier==='basic').length,12);
  assert.equal(MASHAAL_REWARD_CATALOG.filter(item=>item.tier==='premium').length,10);
  assert.ok(MASHAAL_REWARD_CATALOG.every(item=>item.id.startsWith('mashaal-')&&item.visible===true));
  assert.ok(MASHAAL_REWARD_CATALOG.every(item=>item.requirements?.criteria?.length>0));
  assert.ok(MASHAAL_REWARD_CATALOG.filter(item=>item.tier==='premium').every(item=>item.assetPath?.endsWith('.webp')));
});

test('game events unlock Mashaal rewards through shared ledger and rules without leaking to another learner',()=>{
  const catalogRegistry=createRewardCatalogRegistry();catalogRegistry.register(MASHAAL_REWARD_CATALOG_ID,MASHAAL_REWARD_CATALOG);
  const ruleRegistry=createRewardRuleRegistry();ruleRegistry.register('mashaal',{mode:'developmental',rules:MASHAAL_REWARD_RULES});
  const repository=createRewardRepository({storage:memoryStorage()});
  const rewards=createEventRewardService({repository,ruleRegistry,catalogRegistry});
  const event=createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'match-1',at:'2026-09-10T16:30:00.000Z'});
  const first=rewards.handle(event,{context:{rewardProgress:{completions:1,uniqueGamesCompleted:1}}});
  assert.equal(first.added,2);
  assert.equal(first.summary.counts['mashaal-attempt-flower'],1);
  assert.equal(first.summary.counts['mashaal-courage-star'],1);
  const duplicate=rewards.handle(event,{context:{rewardProgress:{completions:1,uniqueGamesCompleted:1}}});
  assert.equal(duplicate.added,0);
  const other=createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'yasser',sessionId:'match-1'});
  assert.equal(rewards.handle(other,{context:{rewardProgress:{completions:1}}}).added,0);
  assert.equal(rewards.getSummary('yasser').total,0);
});

test('Mashaal encouragement is a presentation pack over the shared resolver',()=>{
  const registry=createEncouragementRegistry();registry.register('mashaal',MASHAAL_ENCOURAGEMENT_PACK);
  assert.equal(registry.resolve('mashaal','retry')?.characterState,'try-again');
  assert.equal(registry.resolve('mashaal','reward')?.characterState,'receiving-reward');
  assert.equal(registry.resolve('khaled','reward'),null);
});
