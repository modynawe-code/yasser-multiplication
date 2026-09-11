import test from 'node:test';
import assert from 'node:assert/strict';
import { createXoEventBridge } from '../src/modules/games/xo/xo-events.js';

test('XO event bridge emits retry and completion rewards signals without duplicate completion',()=>{
  const events=[];
  const bridge=createXoEventBridge({onEvent:event=>events.push(event),sessionIdFactory:()=> 'xo-test-session'});
  bridge.begin(['mashaal','khaled']);
  bridge.attempt('mashaal',{isCorrect:false,attemptNumber:1,challengeKind:'kg3-choice'});
  bridge.attempt('mashaal',{isCorrect:true,attemptNumber:2,challengeKind:'kg3-choice'});
  bridge.turn('mashaal',{cell:4});
  bridge.complete({players:['mashaal','khaled'],winner:'mashaal',status:'won'});
  const beforeDuplicate=events.length;
  bridge.complete({players:['mashaal','khaled'],winner:'mashaal',status:'won'});

  assert.equal(events.length,beforeDuplicate);
  assert.ok(events.some(event=>event.type==='game.retry'&&event.learnerId==='mashaal'));
  assert.ok(events.some(event=>event.type==='game.goal.reached'&&event.learnerId==='mashaal'));
  assert.ok(events.some(event=>event.type==='game.won'&&event.learnerId==='mashaal'));
  assert.ok(events.some(event=>event.type==='game.lost'&&event.learnerId==='khaled'));
  assert.equal(events.filter(event=>event.type==='game.completed').length,2);
  assert.ok(events.every(event=>event.gameId==='xo'&&event.sessionId==='xo-test-session'));
});

test('online XO can scope events to the learner on this device',()=>{
  const events=[];
  const bridge=createXoEventBridge({onEvent:event=>events.push(event)});
  bridge.begin(['mashaal','yasser'],{sessionId:'xo-online-123-1',learnerIds:['mashaal']});
  bridge.complete({players:['mashaal','yasser'],winner:'yasser',status:'won',learnerIds:['mashaal']});
  assert.ok(events.length>0);
  assert.ok(events.every(event=>event.learnerId==='mashaal'));
  assert.ok(events.some(event=>event.type==='game.lost'));
  assert.ok(events.some(event=>event.type==='game.completed'));
});
