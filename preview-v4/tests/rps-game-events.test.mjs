import test from 'node:test';
import assert from 'node:assert/strict';
import { createRpsEventBridge } from '../src/modules/games/rps/rps-events.js';

test('RPS emits learner-neutral lifecycle events for every participant exactly once',()=>{
  const events=[];
  const bridge=createRpsEventBridge({onEvent:event=>events.push(event),sessionIdFactory:sequence=>`match-${sequence}`});
  bridge.begin(['yasser','mashaal']);
  bridge.choice('mashaal',{choice:'rock',round:1});
  const finished=bridge.complete({players:['yasser','mashaal'],winner:'mashaal',scores:{yasser:1,mashaal:3},round:4});
  assert.equal(bridge.getSessionId(),'match-1');
  assert.deepEqual(events.slice(0,2).map(event=>event.type),['game.started','game.started']);
  assert.equal(events[2].type,'game.attempted');
  assert.equal(events[2].learnerId,'mashaal');
  assert.deepEqual(finished.map(event=>[event.type,event.learnerId]),[
    ['game.lost','yasser'],['game.completed','yasser'],['game.won','mashaal'],['game.completed','mashaal']
  ]);
  assert.equal(bridge.complete({players:['yasser','mashaal'],winner:'mashaal'}).length,0);
});

test('RPS event bridge supports a future learner without changing its implementation',()=>{
  const events=[];
  const bridge=createRpsEventBridge({onEvent:event=>events.push(event),sessionIdFactory:()=> 'future-match'});
  bridge.begin(['future-child','khaled']);
  bridge.complete({players:['future-child','khaled'],winner:'future-child'});
  assert.ok(events.some(event=>event.type==='game.completed'&&event.learnerId==='future-child'));
});
