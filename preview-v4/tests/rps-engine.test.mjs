import test from 'node:test';
import assert from 'node:assert/strict';
import { createRpsState,nextRpsRound,resolveRpsRound,submitRpsChoice } from '../src/modules/games/rps/rps-engine.js';

test('RPS outcome matrix is correct',()=>{
  assert.equal(resolveRpsRound('rock','scissors'),'a');
  assert.equal(resolveRpsRound('rock','paper'),'b');
  assert.equal(resolveRpsRound('paper','paper'),'draw');
  assert.equal(resolveRpsRound('scissors','paper'),'a');
});

test('RPS keeps the first choice hidden until both players choose',()=>{
  let state=createRpsState({players:['yasser','khaled'],targetScore:3});
  const first=submitRpsChoice(state,{playerId:'yasser',choice:'rock'});
  assert.equal(first.ok,true);assert.equal(first.reveal,false);state=first.state;
  assert.equal(state.status,'choosing');assert.equal(state.chooserIndex,1);
  const second=submitRpsChoice(state,{playerId:'khaled',choice:'scissors'});
  assert.equal(second.ok,true);assert.equal(second.reveal,true);state=second.state;
  assert.equal(state.status,'revealed');assert.equal(state.roundWinner,'yasser');assert.equal(state.scores.yasser,1);
});

test('RPS alternates who chooses first each round',()=>{
  let state=createRpsState({players:['yasser','khaled']});
  state=submitRpsChoice(state,{playerId:'yasser',choice:'rock'}).state;
  state=submitRpsChoice(state,{playerId:'khaled',choice:'paper'}).state;
  state=nextRpsRound(state).state;
  assert.equal(state.round,2);assert.equal(state.chooserIndex,1);
  assert.equal(submitRpsChoice(state,{playerId:'yasser',choice:'rock'}).reason,'not-your-choice');
  assert.equal(submitRpsChoice(state,{playerId:'khaled',choice:'rock'}).ok,true);
});

test('RPS match ends when a player reaches target score',()=>{
  let state=createRpsState({players:['yasser','khaled'],targetScore:2});
  for(let round=0;round<2;round++){
    const firstPlayer=state.players[state.chooserIndex];
    const secondPlayer=state.players[state.chooserIndex===0?1:0];
    const firstChoice=firstPlayer==='yasser'?'rock':'scissors';
    const secondChoice=secondPlayer==='yasser'?'rock':'scissors';
    state=submitRpsChoice(state,{playerId:firstPlayer,choice:firstChoice}).state;
    state=submitRpsChoice(state,{playerId:secondPlayer,choice:secondChoice}).state;
    if(round===0)state=nextRpsRound(state).state;
  }
  assert.equal(state.status,'finished');assert.equal(state.matchWinner,'yasser');assert.equal(state.scores.yasser,2);
});
