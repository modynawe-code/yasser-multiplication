import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOnlineDominoRoom } from '../src/modules/games/domino/domino-online-session.js';

test('online domino room maps private server player ids to learner ids',()=>{
  const room={
    status:'playing',
    players:[
      {playerId:'p1',learnerId:'yasser'},
      {playerId:'p2',learnerId:'khaled'}
    ],
    state:{
      players:['p1','p2'],status:'playing',round:2,
      board:[{tileId:'2-5',left:2,right:5,playedBy:'p2'}],
      hand:['0-0','5-6'],handCounts:{p1:2,p2:4},boneyardCount:5,
      leftEnd:2,rightEnd:5,currentPlayerId:'p1',winner:null,blocked:false,passCount:0,rematchReady:[]
    }
  };
  const state=normalizeOnlineDominoRoom(room);
  assert.deepEqual(state.players,['yasser','khaled']);
  assert.equal(state.currentPlayer,'yasser');
  assert.equal(state.board[0].playedBy,'khaled');
  assert.deepEqual(state.handCounts,{yasser:2,khaled:4});
  assert.deepEqual(state.hand,['0-0','5-6']);
});
