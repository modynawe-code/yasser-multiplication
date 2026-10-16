import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameEvent,isGameEvent } from '../src/modules/games/core/game-event-contract.js';
import { createGameEligibilityService } from '../src/modules/games/core/game-eligibility-service.js';
import { createRewardCatalogRegistry } from '../src/shared/rewards/reward-catalog-registry.js';
import { createRewardRuleRegistry } from '../src/shared/rewards/reward-rule-registry.js';
import { createEncouragementRegistry } from '../src/shared/encouragement/encouragement-registry.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('game events are learner-scoped, immutable and independent from child-specific code',()=>{
  const event=createGameEvent({
    type:'game.completed',
    gameId:'rock-paper-scissors',
    learnerId:'mashaal',
    sessionId:'round-1',
    at:'2026-09-10T16:00:00.000Z',
    payload:{attempts:2}
  });
  assert.equal(isGameEvent(event),true);
  assert.equal(event.learnerId,'mashaal');
  assert.equal(event.payload.attempts,2);
  assert.equal(Object.isFrozen(event),true);
  assert.equal(Object.isFrozen(event.payload),true);
  assert.throws(()=>createGameEvent({type:'unknown',gameId:'xo',learnerId:'mashaal'}),/unsupported game event type/);
});

test('game eligibility is capability-driven rather than hard-coded per child',()=>{
  const service=createGameEligibilityService();
  service.registerLearner('mashaal',{capabilities:['developmental','guided-play','turn-taking','visual']});
  service.registerLearner('yasser',{capabilities:['academic','strategy','turn-taking']});
  const guidedGame={metadata:{eligibility:{allOf:['turn-taking'],anyOf:['guided-play','strategy'],noneOf:['blocked']}}};
  const academicGame={metadata:{eligibility:{allOf:['academic','numeracy']}}};
  assert.equal(service.evaluate(guidedGame,'mashaal').eligible,true);
  assert.equal(service.evaluate(guidedGame,'yasser').eligible,true);
  assert.equal(service.evaluate(academicGame,'mashaal').eligible,false);
  assert.deepEqual(service.getCapabilities('mashaal').includes('stage:kg3'),true);
});

test('reward catalogs are extensible packs while reward ids remain globally unambiguous',()=>{
  const registry=createRewardCatalogRegistry();
  registry.register('academic-core',[{id:'mastery-cup',label:'كأس الإتقان',graphicKey:'mastery-cup'}]);
  registry.register('mashaal-developmental',[{id:'mashaal-attempt-flower',label:'زهرة المحاولة',graphicKey:'mashaal.reward.attempt-flower'}]);
  assert.equal(registry.getReward('mashaal-attempt-flower')?.label,'زهرة المحاولة');
  assert.equal(registry.getCatalogIdForReward('mashaal-attempt-flower'),'mashaal-developmental');
  assert.throws(()=>registry.register('duplicate-pack',[{id:'mastery-cup',label:'نسخة مكررة'}]),/reward id already registered/);
});

test('reward rules stay learner-scoped and can use developmental game events',()=>{
  const registry=createRewardRuleRegistry();
  registry.register('mashaal',{
    mode:'developmental',
    rules:[{
      id:'attempt-flower',
      rewardId:'mashaal-attempt-flower',
      eventTypes:['game.completed'],
      when:event=>Number(event.payload?.attempts||0)>=1
    }]
  });
  const event=createGameEvent({type:'game.completed',gameId:'xo',learnerId:'mashaal',payload:{attempts:1}});
  assert.equal(registry.get('mashaal')?.mode,'developmental');
  assert.deepEqual(registry.matching('mashaal',event).map(rule=>rule.id),['attempt-flower']);
  assert.deepEqual(registry.matching('yasser',event),[]);
});

test('encouragement packs reuse one resolver while preserving learner-specific presentation',()=>{
  const registry=createEncouragementRegistry();
  registry.register('mashaal',{cues:{retry:[
    {text:'جرّبي مرة ثانية',voiceKey:'mashaal.retry.1',characterState:'try-again'},
    {text:'محاولة جميلة',voiceKey:'mashaal.retry.2',characterState:'encouraging'}
  ]}});
  assert.equal(registry.resolve('mashaal','retry')?.characterState,'try-again');
  assert.equal(registry.resolve('mashaal','retry',{index:1})?.text,'محاولة جميلة');
  assert.equal(registry.resolve('yasser','retry'),null);
});

test('new shared foundation contains no Mashaal-specific branching',async()=>{
  const paths=[
    'src/modules/games/core/game-event-contract.js',
    'src/modules/games/core/game-eligibility-service.js',
    'src/shared/rewards/reward-catalog-registry.js',
    'src/shared/rewards/reward-rule-registry.js',
    'src/shared/encouragement/encouragement-registry.js'
  ];
  for(const path of paths){
    const source=await read(path);
    assert.doesNotMatch(source,/mashaal/i,`${path} must stay learner-neutral`);
  }
});
