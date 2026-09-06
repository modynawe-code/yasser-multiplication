import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { addXoRoomGuest, applyXoRoomAction, createInitialXoRoomState } from '../src/game-rooms.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('XO online room waits for two players before play',()=>{
  const waiting=createInitialXoRoomState('host');
  assert.equal(waiting.status,'waiting');
  assert.equal(waiting.currentPlayerId,null);
  const joined=addXoRoomGuest(waiting,'guest');
  assert.equal(joined.ok,true);
  assert.equal(joined.state.status,'playing');
  assert.equal(joined.state.currentPlayerId,'host');
  assert.deepEqual(joined.state.players,['host','guest']);
});

test('server room action enforces turn and immutable board ownership',()=>{
  const joined=addXoRoomGuest(createInitialXoRoomState('host'),'guest').state;
  assert.equal(applyXoRoomAction(joined,{playerId:'guest',type:'move',cell:0}).reason,'not-your-turn');
  const first=applyXoRoomAction(joined,{playerId:'host',type:'move',cell:0});
  assert.equal(first.ok,true);
  assert.equal(first.state.board[0],'host');
  assert.equal(joined.board[0],null);
  assert.equal(first.state.currentPlayerId,'guest');
});

test('server detects XO winner and rejects moves after completion',()=>{
  let state=addXoRoomGuest(createInitialXoRoomState('a'),'b').state;
  for(const [playerId,cell] of [['a',0],['b',3],['a',1],['b',4],['a',2]]){
    const result=applyXoRoomAction(state,{playerId,type:'move',cell});assert.equal(result.ok,true);state=result.state;
  }
  assert.equal(state.status,'won');
  assert.equal(state.winner,'a');
  assert.deepEqual(state.winningLine,[0,1,2]);
  assert.equal(applyXoRoomAction(state,{playerId:'b',type:'move',cell:5}).reason,'game-not-playing');
});

test('online room storage keeps temporary player tokens hashed and uses six-digit codes',async()=>{
  const source=await read('src/game-rooms.mjs'),migration=await read('migrations/0002_game_rooms.sql'),index=await read('src/index.mjs');
  assert.match(source,/sha256Base64Url\(playerToken\)/);
  assert.match(source,/padStart\(6,'0'\)/);
  assert.match(source,/expectedVersion/);
  assert.match(migration,/token_hash TEXT NOT NULL/);
  assert.doesNotMatch(migration,/player_token TEXT/);
  assert.match(index,/x-game-token/);
  assert.match(index,/handleGameRoomRequest/);
});
