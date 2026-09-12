import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDominoRoomGuest,
  applyDominoRoomAction,
  createInitialDominoRoomState,
  getGameRoomRules,
  projectDominoRoomState
} from '../src/game-room-rules.mjs';

test('domino room deals a complete double-six set to two players',()=>{
  const waiting=createInitialDominoRoomState('host');
  const joined=addDominoRoomGuest(waiting,'guest');
  assert.equal(joined.ok,true);
  assert.equal(joined.state.status,'playing');
  assert.equal(joined.state.players.length,2);
  assert.equal(joined.state.hands.host.length,7);
  assert.equal(joined.state.hands.guest.length,7);
  assert.equal(joined.state.boneyard.length,14);
  const all=[...joined.state.hands.host,...joined.state.hands.guest,...joined.state.boneyard];
  assert.equal(new Set(all).size,28);
});

test('domino projection never exposes the opponent hand or boneyard tiles',()=>{
  const state={
    gameId:'domino',status:'playing',players:['host','guest'],
    hands:{host:['0-0','1-2'],guest:['6-6','5-6']},boneyard:['3-4','4-4'],
    board:[],leftEnd:null,rightEnd:null,currentPlayerId:'host',winner:null,blocked:false,passCount:0,rematchReady:[],round:1
  };
  const projected=projectDominoRoomState(state,{viewerPlayerId:'host'});
  assert.deepEqual(projected.hand,['0-0','1-2']);
  assert.deepEqual(projected.handCounts,{host:2,guest:2});
  assert.equal(projected.boneyardCount,2);
  assert.equal('hands' in projected,false);
  assert.equal('boneyard' in projected,false);
});

test('domino validates matching ends and advances the turn',()=>{
  const state={
    gameId:'domino',status:'playing',players:['host','guest'],
    hands:{host:['2-5','1-1'],guest:['3-6','0-4']},boneyard:[],
    board:[{tileId:'2-3',left:2,right:3,playedBy:'guest'}],leftEnd:2,rightEnd:3,
    currentPlayerId:'host',winner:null,blocked:false,passCount:0,rematchReady:[],round:1
  };
  const played=applyDominoRoomAction(state,{playerId:'host',type:'play',payload:{tileId:'2-5',side:'left'}});
  assert.equal(played.ok,true);
  assert.equal(played.state.leftEnd,5);
  assert.equal(played.state.currentPlayerId,'guest');
  assert.deepEqual(played.state.hands.host,['1-1']);
  const invalid=applyDominoRoomAction(state,{playerId:'host',type:'play',payload:{tileId:'1-1',side:'right'}});
  assert.equal(invalid.ok,false);
  assert.equal(invalid.reason,'tile-does-not-match');
});

test('domino blocked round is resolved by the lower pip total',()=>{
  const state={
    gameId:'domino',status:'playing',players:['host','guest'],
    hands:{host:['6-6'],guest:['1-2']},boneyard:[],
    board:[{tileId:'4-4',left:4,right:4,playedBy:'guest'}],leftEnd:4,rightEnd:4,
    currentPlayerId:'host',winner:null,blocked:false,passCount:0,rematchReady:[],round:1
  };
  const first=applyDominoRoomAction(state,{playerId:'host',type:'pass'});
  assert.equal(first.ok,true);
  assert.equal(first.state.currentPlayerId,'guest');
  const second=applyDominoRoomAction(first.state,{playerId:'guest',type:'pass'});
  assert.equal(second.ok,true);
  assert.equal(second.state.status,'finished');
  assert.equal(second.state.winner,'guest');
  assert.equal(second.state.blocked,true);
});

test('domino is registered as a two-player server-authoritative room game',()=>{
  const rules=getGameRoomRules('domino');
  assert.equal(rules?.maxPlayers,2);
  assert.equal(typeof rules?.applyAction,'function');
  assert.equal(typeof rules?.projectState,'function');
});
