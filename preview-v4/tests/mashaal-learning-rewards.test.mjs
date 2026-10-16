import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameEvent } from '../src/modules/games/core/game-event-contract.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createFamilyGameRewardRuntime } from '../src/composition/game-reward-runtime.js';
import { createGameEventBus } from '../src/modules/games/core/game-event-bus.js';

function memoryStorage(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}

test('Mashaal learning completion can unlock the same developmental reward path as family games',()=>{
  const storage=memoryStorage(),repository=createRewardRepository({storage}),bus=createGameEventBus();
  const runtime=createFamilyGameRewardRuntime({repository,eventBus:bus,progressStorage:storage,progressionStorage:storage});
  const event=createGameEvent({type:'game.completed',gameId:'kg3-letter-hunt-ba-01',learnerId:'mashaal',sessionId:'evidence-1',payload:{skillId:'sound-awareness',source:'mashaal-learning'}});
  runtime.handle(event);
  const summary=runtime.getSummary('mashaal');
  assert.equal(summary.progress.completions,1);
  assert.equal(summary.counts['mashaal-attempt-flower'],1);
  assert.equal(summary.counts['mashaal-courage-star'],1);
  runtime.stop();
});

test('Mashaal controller and composition bridge completed learning evidence into reward events',async()=>{
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(controller,/onActivityCompleted/);
  assert.match(controller,/notifyActivityCompleted\(evidence\)/);
  assert.match(main,/source:'mashaal-learning'/);
  assert.match(main,/type:'game\.completed'/);
  assert.match(main,/gameId:event\.activityId/);
  assert.match(main,/sessionId:event\.evidenceId/);
});
