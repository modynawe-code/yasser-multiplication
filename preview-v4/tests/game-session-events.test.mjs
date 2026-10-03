import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSessionEvents } from '../src/modules/games/core/game-session-events.js';
import { createXoEventBridge } from '../src/modules/games/xo/xo-events.js';
import { createRpsEventBridge } from '../src/modules/games/rps/rps-events.js';

test('shared game session lifecycle emits scoped immutable events once',()=>{
  const published=[];
  const session=createGameSessionEvents({
    gameId:'demo-game',
    onEvent:event=>published.push(event),
    sessionIdFactory:sequence=>`demo-${sequence}`
  });

  const started=session.begin(['yasser','khaled'],{learnerIds:['yasser']});
  assert.equal(session.getSessionId(),'demo-1');
  assert.deepEqual(started.map(event=>event.type),['game.started']);
  assert.deepEqual(started[0].payload.players,['yasser','khaled']);
  assert.equal(Object.isFrozen(started[0]),true);

  session.emit('game.attempted','yasser',{answer:4});
  const completed=session.complete({
    players:['yasser','khaled'],
    winner:'yasser',
    payload:{status:'won'},
    winnerGoal:{goal:'win'}
  });
  assert.deepEqual(completed.map(event=>event.type),[
    'game.won','game.goal.reached','game.completed','game.lost','game.completed'
  ]);
  assert.equal(completed[0].payload.status,'won');
  assert.equal(completed[1].payload.goal,'win');
  assert.deepEqual(session.complete({players:['yasser','khaled']}),[]);
  assert.equal(published.length,7);

  session.reset();
  assert.equal(session.getSessionId(),null);
  assert.equal(session.isFinished(),false);
});

test('XO adapter preserves learning attempts, retries, turns and winner goal events',()=>{
  const events=[];
  const bridge=createXoEventBridge({onEvent:event=>events.push(event),sessionIdFactory:()=> 'xo-test'});
  bridge.begin(['yasser','khaled']);
  bridge.attempt('yasser',{isCorrect:false,attemptNumber:2,challengeKind:'math'});
  bridge.turn('yasser',{cell:3,online:true});
  bridge.complete({players:['yasser','khaled'],winner:'yasser',status:'won'});
  assert.deepEqual(events.map(event=>event.type),[
    'game.started','game.started','game.attempted','game.retry','game.turn.completed',
    'game.won','game.goal.reached','game.completed','game.lost','game.completed'
  ]);
  assert.equal(events[6].payload.goal,'win');
  assert.equal(events[7].payload.status,'won');
});

test('RPS adapter preserves choice and match completion events without game-specific core branching',()=>{
  const events=[];
  const bridge=createRpsEventBridge({onEvent:event=>events.push(event),sessionIdFactory:()=> 'rps-test'});
  bridge.begin(['yasser','khaled']);
  bridge.choice('khaled',{choice:'rock',round:1});
  bridge.complete({players:['yasser','khaled'],winner:'khaled',scores:{yasser:1,khaled:3},round:4});
  assert.deepEqual(events.map(event=>event.type),[
    'game.started','game.started','game.attempted','game.lost','game.completed','game.won','game.completed'
  ]);
  assert.deepEqual(events[5].payload.scores,{yasser:1,khaled:3});
  assert.equal(events.some(event=>event.type==='game.goal.reached'),false);
});
