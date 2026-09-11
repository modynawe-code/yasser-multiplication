import test from 'node:test';
import assert from 'node:assert/strict';
import { createXoState, passXoTurn, playXoMove } from '../src/modules/games/xo/xo-engine.js';

function move(state,playerId,cell){
  const result=playXoMove(state,{playerId,cell});
  assert.equal(result.ok,true,result.reason||'move should succeed');
  return result.state;
}

test('XO enforces turn ownership and occupied cells',()=>{
  let state=createXoState({players:['yasser','khaled']});
  assert.equal(playXoMove(state,{playerId:'khaled',cell:0}).reason,'not-your-turn');
  state=move(state,'yasser',0);
  assert.equal(playXoMove(state,{playerId:'khaled',cell:0}).reason,'occupied-cell');
});

test('XO detects a row winner and freezes the finished game',()=>{
  let state=createXoState({players:['yasser','khaled']});
  state=move(state,'yasser',0);
  state=move(state,'khaled',3);
  state=move(state,'yasser',1);
  state=move(state,'khaled',4);
  state=move(state,'yasser',2);
  assert.equal(state.status,'won');
  assert.equal(state.winner,'yasser');
  assert.deepEqual(state.winningLine,[0,1,2]);
  assert.equal(playXoMove(state,{playerId:'khaled',cell:5}).reason,'game-finished');
});

test('XO detects a diagonal winner',()=>{
  let state=createXoState({players:['khaled','yasser']});
  state=move(state,'khaled',0);
  state=move(state,'yasser',1);
  state=move(state,'khaled',4);
  state=move(state,'yasser',2);
  state=move(state,'khaled',8);
  assert.equal(state.winner,'khaled');
  assert.deepEqual(state.winningLine,[0,4,8]);
});

test('XO detects a full-board draw',()=>{
  let state=createXoState({players:['a','b']});
  for(const [player,cell] of [['a',0],['b',1],['a',2],['b',4],['a',3],['b',5],['a',7],['b',6],['a',8]])state=move(state,player,cell);
  assert.equal(state.status,'draw');
  assert.equal(state.winner,null);
  assert.equal(state.moveCount,9);
});

test('XO can pass a turn after a failed learning gate without changing the board',()=>{
  const initial=createXoState({players:['yasser','khaled']});
  const passed=passXoTurn(initial,{playerId:'yasser'});
  assert.equal(passed.ok,true);
  assert.equal(passed.state.currentPlayer,'khaled');
  assert.equal(passed.state.passCount,1);
  assert.deepEqual(passed.state.board,initial.board);
  assert.equal(passed.state.moveCount,0);
  assert.equal(passXoTurn(initial,{playerId:'khaled'}).reason,'not-your-turn');
});

test('XO state updates are immutable for safe realtime synchronization',()=>{
  const initial=createXoState({players:['a','b']});
  const next=move(initial,'a',0);
  assert.equal(initial.board[0],null);
  assert.equal(next.board[0],'a');
  assert.notEqual(initial,next);
});
