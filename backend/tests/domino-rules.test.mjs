import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDominoRoomGuest,
  applyDominoRoomAction,
  createInitialDominoRoomState,
  getGameRoomRules,
  projectDominoRoomState
} from '../src/game-room-rules.mjs';
import {
  CLASSIC_MOVE_STATE,
  classicAbleToPlay,
  classicMovePermission,
  orientClassicMove,
  pickClassicFirstMove
} from '../src/domino-classic-engine.mjs';

function baseState({hands,boneyard=[],board=[{tileId:'6-6',left:6,right:6,playedBy:'starter'}],currentPlayerId='host'}={}){
  return {
    gameId:'domino',status:'playing',players:['host','guest'],hands,boneyard,board,
    leftEnd:board[0]?.left??null,rightEnd:board.at(-1)?.right??null,
    currentPlayerId,winner:null,blocked:false,roundTotals:{},passCount:0,
    openingPlayerId:'starter',openingTileId:'6-6',rematchReady:[],round:1
  };
}

test('classic domino starts by auto-playing the strongest opening tile',()=>{
  const waiting=createInitialDominoRoomState('host');
  const joined=addDominoRoomGuest(waiting,'guest');
  assert.equal(joined.ok,true);
  const state=joined.state;
  assert.equal(state.status,'playing');
  assert.equal(state.players.length,2);
  assert.equal(state.board.length,1);
  assert.ok(['host','guest'].includes(state.openingPlayerId));
  assert.equal(state.board[0].playedBy,state.openingPlayerId);
  assert.equal(state.board[0].tileId,state.openingTileId);
  assert.notEqual(state.currentPlayerId,state.openingPlayerId);
  const handSizes=[state.hands.host.length,state.hands.guest.length].sort((a,b)=>a-b);
  assert.deepEqual(handSizes,[6,7]);
  assert.equal(state.boneyard.length,14);
  const all=[...state.hands.host,...state.hands.guest,...state.boneyard,...state.board.map(item=>item.tileId)];
  assert.equal(all.length,28);
  assert.equal(new Set(all).size,28);
});

test('classic opener prefers the highest double and falls back to highest pip sum',()=>{
  const withDouble=pickClassicFirstMove(['a','b'],{a:['5-5','6-2'],b:['6-6','4-4']});
  assert.equal(withDouble.playerId,'b');
  assert.equal(withDouble.tileId,'6-6');
  const noDouble=pickClassicFirstMove(['a','b'],{a:['6-4','5-3'],b:['6-5','4-3']});
  assert.equal(noDouble.playerId,'b');
  assert.equal(noDouble.tileId,'6-5');
});

test('domino projection never exposes the opponent hand or boneyard tiles',()=>{
  const state=baseState({hands:{host:['0-0','2-1'],guest:['6-6','6-5']},boneyard:['4-3','4-4'],board:[],currentPlayerId:'host'});
  const projected=projectDominoRoomState(state,{viewerPlayerId:'host'});
  assert.deepEqual(projected.hand,['0-0','2-1']);
  assert.deepEqual(projected.handCounts,{host:2,guest:2});
  assert.equal(projected.boneyardCount,2);
  assert.equal('hands' in projected,false);
  assert.equal('boneyard' in projected,false);
});

test('classic domino validates ends, orients the tile, and advances the turn',()=>{
  assert.equal(classicMovePermission('5-2',{left:2,right:3},'left'),true);
  assert.deepEqual(orientClassicMove('5-2',{left:2,right:3},'left'),{left:5,right:2});
  const state=baseState({
    hands:{host:['5-2','1-1'],guest:['6-3','4-0']},
    board:[{tileId:'3-2',left:2,right:3,playedBy:'guest'}],
    currentPlayerId:'host'
  });
  const played=applyDominoRoomAction(state,{playerId:'host',type:'play',payload:{tileId:'5-2',side:'left'}});
  assert.equal(played.ok,true);
  assert.equal(played.state.leftEnd,5);
  assert.equal(played.state.currentPlayerId,'guest');
  assert.deepEqual(played.state.hands.host,['1-1']);
  const invalid=applyDominoRoomAction(state,{playerId:'host',type:'play',payload:{tileId:'1-1',side:'right'}});
  assert.equal(invalid.ok,false);
  assert.equal(invalid.reason,'tile-does-not-match');
});

test('classic domino keeps drawing until a move appears or the stock empties, then auto-skips',()=>{
  const state=baseState({
    hands:{host:['1-1'],guest:['6-5']},
    boneyard:['2-2','3-3'],
    currentPlayerId:'host'
  });
  assert.equal(classicAbleToPlay('host',state.players,state.hands,state.boneyard.length,state.board),CLASSIC_MOVE_STATE.AVAILABLE);
  const first=applyDominoRoomAction(state,{playerId:'host',type:'draw'});
  assert.equal(first.ok,true);
  assert.equal(first.state.currentPlayerId,'host');
  assert.equal(first.state.hands.host.length,2);
  assert.equal(first.state.boneyard.length,1);
  const second=applyDominoRoomAction(first.state,{playerId:'host',type:'draw'});
  assert.equal(second.ok,true);
  assert.equal(second.state.boneyard.length,0);
  assert.equal(second.state.currentPlayerId,'guest');
  assert.equal(second.state.status,'playing');
});

test('classic dead-end finishes immediately with the lower pip total',()=>{
  const state=baseState({
    hands:{host:['1-1'],guest:['2-2']},
    boneyard:[],
    currentPlayerId:'host'
  });
  const finished=applyDominoRoomAction(state,{playerId:'host',type:'pass'});
  assert.equal(finished.ok,true);
  assert.equal(finished.state.status,'finished');
  assert.equal(finished.state.winner,'host');
  assert.equal(finished.state.blocked,true);
  assert.deepEqual(finished.state.roundTotals,{host:2,guest:4});
});

test('domino is registered as a two-player server-authoritative room game',()=>{
  const rules=getGameRoomRules('domino');
  assert.equal(rules?.maxPlayers,2);
  assert.equal(typeof rules?.applyAction,'function');
  assert.equal(typeof rules?.projectState,'function');
});
