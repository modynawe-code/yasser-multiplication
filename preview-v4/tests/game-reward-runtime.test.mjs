import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameEventBus } from '../src/modules/games/core/game-event-bus.js';
import { createGameEvent } from '../src/modules/games/core/game-event-contract.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createFamilyGameRewardRuntime } from '../src/composition/game-reward-runtime.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}

test('family game reward runtime composes learner-specific rules over shared services',()=>{
  const bus=createGameEventBus(),repository=createRewardRepository({storage:memoryStorage()}),announcements=[];
  const runtime=createFamilyGameRewardRuntime({repository,eventBus:bus,onReward:item=>announcements.push(item)});
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'m-1'}));
  assert.equal(runtime.getSummary('mashaal').counts['mashaal-attempt-flower'],1);
  assert.equal(runtime.getSummary('mashaal').counts['mashaal-courage-star'],1);
  assert.equal(announcements.length,1);
  assert.equal(announcements[0].cue?.characterState,'receiving-reward');
  assert.equal(announcements[0].characterState?.assetKey,'mashaal.character.receiving-reward');
  assert.equal(runtime.characterStates.supports('mashaal','receiving-reward'),true);
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'khaled',sessionId:'k-1'}));
  assert.equal(runtime.getSummary('khaled').total,0);
  runtime.stop();
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'m-2'}));
  assert.equal(runtime.getSummary('mashaal').total,2);
});
