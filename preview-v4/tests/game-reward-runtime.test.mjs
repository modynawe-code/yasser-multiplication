import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameEventBus } from '../src/modules/games/core/game-event-bus.js';
import { createGameEvent } from '../src/modules/games/core/game-event-contract.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createFamilyGameRewardRuntime } from '../src/composition/game-reward-runtime.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}

test('family game reward runtime composes rewards and progression over shared game events',()=>{
  const bus=createGameEventBus(),storage=memoryStorage(),repository=createRewardRepository({storage}),announcements=[];
  const runtime=createFamilyGameRewardRuntime({repository,eventBus:bus,onReward:item=>announcements.push(item),progressStorage:storage});
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'m-1'}));
  assert.equal(runtime.getSummary('mashaal').counts['mashaal-attempt-flower'],1);
  assert.equal(runtime.getSummary('mashaal').counts['mashaal-courage-star'],1);
  assert.equal(runtime.getProgression('mashaal').xp,20);
  assert.equal(runtime.getProgression('mashaal').level,1);
  assert.equal(announcements.length,1);
  assert.equal(announcements[0].cue?.characterState,'receiving-reward');
  assert.equal(announcements[0].characterState?.assetKey,'mashaal.character.receiving-reward');
  assert.equal(runtime.characterStates.supports('mashaal','receiving-reward'),true);
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'khaled',sessionId:'k-1'}));
  assert.equal(runtime.getSummary('khaled').total,0);
  assert.equal(runtime.getProgression('khaled').xp,20);
  runtime.stop();
  bus.publish(createGameEvent({type:'game.completed',gameId:'rock-paper-scissors',learnerId:'mashaal',sessionId:'m-2'}));
  assert.equal(runtime.getSummary('mashaal').total,2);
  assert.equal(runtime.getProgression('mashaal').xp,20);
});
