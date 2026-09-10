import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameRewardProgressTracker } from '../src/shared/rewards/game-reward-progress-tracker.js';
import { rewardRequirementProgress,rewardRequirementsMet } from '../src/shared/rewards/reward-requirement-progress.js';
import { MASHAAL_REWARD_CATALOG } from '../src/modules/mashaal/rewards/mashaal-reward-catalog.js';
import { createFamilyGameRewardRuntime } from '../src/composition/game-reward-runtime.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createGameEventBus } from '../src/modules/games/core/game-event-bus.js';
import { createGameEvent } from '../src/modules/games/core/game-event-contract.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}

test('generic reward progress tracker persists metrics per learner and deduplicates lifecycle events',()=>{
  const storage=memoryStorage(),tracker=createGameRewardProgressTracker({storage});
  const event=createGameEvent({type:'game.completed',gameId:'xo',learnerId:'mashaal',sessionId:'one'});
  tracker.record(event);tracker.record(event);
  tracker.record(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'two'}));
  assert.deepEqual(tracker.get('mashaal'),{completions:2,wins:0,retries:0,goals:0,cooperations:0,uniqueGamesCompleted:2,completedGames:['xo','rock-paper-scissors']});
  assert.equal(tracker.get('yasser').completions,0);
});

test('visible requirement progress is calculated from the same criteria used for unlocks',()=>{
  const crown=MASHAAL_REWARD_CATALOG.find(item=>item.id==='mashaal-premium-crown');
  const detail=rewardRequirementProgress(crown,{completions:20,wins:4,uniqueGamesCompleted:2});
  assert.equal(detail.complete,false);
  assert.equal(detail.criteria.find(item=>item.metric==='wins').remaining,1);
  assert.equal(rewardRequirementsMet(crown,{completions:20,wins:5,uniqueGamesCompleted:2}),true);
});

test('runtime feeds live progress into rules so milestone and premium rewards unlock at their visible targets',()=>{
  const storage=memoryStorage(),repository=createRewardRepository({storage}),bus=createGameEventBus();
  const runtime=createFamilyGameRewardRuntime({repository,eventBus:bus,progressStorage:storage});
  for(let i=1;i<=8;i++)bus.publish(createGameEvent({type:'game.completed',gameId:i===2?'rock-paper-scissors':'xo',learnerId:'mashaal',sessionId:`c-${i}`}));
  const summary=runtime.getSummary('mashaal');
  assert.equal(summary.progress.completions,8);
  assert.equal(summary.progress.uniqueGamesCompleted,2);
  assert.equal(summary.counts['mashaal-progress-butterfly'],1);
  assert.equal(summary.counts['mashaal-variety-rainbow'],1);
  assert.equal(summary.counts['mashaal-premium-shoes'],1);
  assert.equal(summary.counts['mashaal-premium-hair-bows'],1);
  runtime.stop();
});
