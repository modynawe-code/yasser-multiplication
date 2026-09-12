import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { addXoRoomGuest, applyXoRoomAction, createInitialXoRoomState } from '../src/game-rooms.mjs';
import { addRpsRoomGuest, applyRpsRoomAction, createInitialRpsRoomState, getGameRoomRules, listGameRoomRuleIds, projectRpsRoomState } from '../src/game-room-rules.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('XO online room waits for two players before play',()=>{
  const waiting=createInitialXoRoomState('host');
  assert.equal(waiting.status,'waiting');
  assert.equal(waiting.currentPlayerId,null);
  assert.deepEqual(waiting.rematchReady,[]);
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

test('server requires both players before starting an online rematch',()=>{
  let state=addXoRoomGuest(createInitialXoRoomState('a'),'b').state;
  for(const [playerId,cell] of [['a',0],['b',3],['a',1],['b',4],['a',2]]){
    const result=applyXoRoomAction(state,{playerId,type:'move',cell});assert.equal(result.ok,true);state=result.state;
  }
  assert.equal(state.status,'won');
  assert.equal(state.winner,'a');
  assert.deepEqual(state.winningLine,[0,1,2]);
  const firstReady=applyXoRoomAction(state,{playerId:'a',type:'reset'});
  assert.equal(firstReady.ok,true);
  assert.equal(firstReady.state.status,'won');
  assert.deepEqual(firstReady.state.rematchReady,['a']);
  assert.equal(applyXoRoomAction(firstReady.state,{playerId:'a',type:'reset'}).reason,'rematch-already-ready');
  const rematch=applyXoRoomAction(firstReady.state,{playerId:'b',type:'reset'});
  assert.equal(rematch.ok,true);
  assert.equal(rematch.state.status,'playing');
  assert.equal(rematch.state.round,2);
  assert.equal(rematch.state.currentPlayerId,'b');
  assert.deepEqual(rematch.state.rematchReady,[]);
  assert.deepEqual(rematch.state.board,Array(9).fill(null));
});

test('room transport dispatches game-specific state changes through a rule registry',()=>{
  assert.deepEqual(listGameRoomRuleIds(),['xo','rock-paper-scissors']);
  assert.equal(getGameRoomRules('unknown'),null);
  const rules=getGameRoomRules('xo');
  let state=rules.addPlayer(rules.createInitialState('host'),'guest').state;
  const moved=rules.applyAction(state,{playerId:'host',type:'move',payload:{cell:4}});
  assert.equal(moved.ok,true);
  assert.equal(moved.state.board[4],'host');
  assert.equal(rules.maxPlayers,2);
  assert.equal(rules.maxSpectators,8);
});

test('RPS online rules support simultaneous private choices and reveal only after both choose',()=>{
  let state=addRpsRoomGuest(createInitialRpsRoomState('a'),'b').state;
  assert.equal(state.status,'playing');
  assert.equal(state.phase,'choosing');
  const first=applyRpsRoomAction(state,{playerId:'a',type:'choose',payload:{choice:'rock'}});
  assert.equal(first.ok,true);state=first.state;
  assert.deepEqual(projectRpsRoomState(state,{viewerPlayerId:'a'}).choices,{a:'rock'});
  assert.deepEqual(projectRpsRoomState(state,{viewerPlayerId:'b'}).choices,{});
  assert.deepEqual(projectRpsRoomState(state,{viewerPlayerId:'b'}).chosenPlayers,['a']);
  const second=applyRpsRoomAction(state,{playerId:'b',type:'choose',payload:{choice:'scissors'}});
  assert.equal(second.ok,true);state=second.state;
  assert.equal(state.phase,'revealed');
  assert.equal(state.roundWinner,'a');
  assert.equal(state.scores.a,1);
  assert.deepEqual(projectRpsRoomState(state,{viewerPlayerId:'b'}).choices,{a:'rock',b:'scissors'});
});

test('RPS online match reaches target score and requires mutual rematch readiness',()=>{
  let state=addRpsRoomGuest(createInitialRpsRoomState('a'),'b').state;
  for(let round=0;round<3;round++){
    state=applyRpsRoomAction(state,{playerId:'a',type:'choose',payload:{choice:'rock'}}).state;
    state=applyRpsRoomAction(state,{playerId:'b',type:'choose',payload:{choice:'scissors'}}).state;
    if(round<2)state=applyRpsRoomAction(state,{playerId:'a',type:'next'}).state;
  }
  assert.equal(state.status,'finished');
  assert.equal(state.matchWinner,'a');
  assert.equal(state.scores.a,3);
  const firstReady=applyRpsRoomAction(state,{playerId:'a',type:'reset'});
  assert.deepEqual(firstReady.state.rematchReady,['a']);
  const rematch=applyRpsRoomAction(firstReady.state,{playerId:'b',type:'reset'});
  assert.equal(rematch.state.status,'playing');
  assert.equal(rematch.state.phase,'choosing');
  assert.equal(rematch.state.round,1);
  assert.deepEqual(rematch.state.scores,{a:0,b:0});
});

test('general room migration preserves XO data while opening games and participant roles',async()=>{
  const migration=await read('migrations/0006_general_game_room_participants.sql');
  assert.match(migration,/game_rooms_v2/);
  assert.match(migration,/game_room_players_v3/);
  assert.match(migration,/participation_role TEXT NOT NULL DEFAULT 'player'/);
  assert.match(migration,/authority_role TEXT NOT NULL DEFAULT 'guest'/);
  assert.match(migration,/seat IS NULL/);
  assert.match(migration,/CASE WHEN seat=0 THEN 'host' ELSE 'guest' END/);
  assert.doesNotMatch(migration,/game_id IN \('xo'\)/);
});

test('room backend exposes spectator roles, state projection and prevents spectator actions',async()=>{
  const source=await read('src/game-rooms.mjs');
  assert.match(source,/participationRole/);
  assert.match(source,/authorityRole/);
  assert.match(source,/spectator_cannot_act/);
  assert.match(source,/maxSpectators/);
  assert.match(source,/seat===null\?null/);
  assert.match(source,/projectState/);
  assert.match(source,/viewerPlayerId/);
});

test('online room storage keeps temporary player tokens hashed and uses six-digit codes',async()=>{
  const source=await read('src/game-rooms.mjs'),migration=await read('migrations/0002_game_rooms.sql'),index=await read('src/index.mjs');
  assert.match(source,/sha256Base64Url\(playerToken\)/);
  assert.match(source,/padStart\(6,'0'\)/);
  assert.match(source,/expectedVersion/);
  assert.match(source,/getGameRoomRules/);
  assert.match(migration,/token_hash TEXT NOT NULL/);
  assert.doesNotMatch(migration,/player_token TEXT/);
  assert.match(index,/x-game-token/);
  assert.match(index,/handleGameRoomRequest/);
});

test('online game learner identity is open-ended but strictly normalized',async()=>{
  const source=await read('src/game-rooms.mjs'),migration=await read('migrations/0004_open_family_learners.sql');
  assert.match(source,/normalizeLearnerSlug/);
  assert.match(source,/DEFAULT_DISPLAY_NAMES/);
  assert.match(source,/mashaal:'مشاعل'/);
  assert.doesNotMatch(source,/value==='yasser'\|\|value==='khaled'/);
  assert.doesNotMatch(migration,/learner_id IN \('yasser','khaled'\)/);
  assert.match(migration,/length\(learner_id\) BETWEEN 1 AND 64/);
  assert.match(migration,/game_room_players_v2/);
});

test('room join guessing is independently throttled in D1',async()=>{
  const source=await read('src/game-rooms.mjs'),migration=await read('migrations/0003_game_room_join_throttle.sql');
  assert.match(source,/MAX_JOIN_ATTEMPTS=20/);
  assert.match(source,/too_many_join_attempts/);
  assert.match(source,/game_room_join_throttle/);
  assert.match(migration,/CREATE TABLE IF NOT EXISTS game_room_join_throttle/);
  assert.match(migration,/blocked_until TEXT/);
});

test('a losing concurrent join removes its temporary seat before returning conflict',async()=>{
  const source=await read('src/game-rooms.mjs');
  assert.match(source,/DELETE FROM game_room_players WHERE room_id=\? AND player_id=\?/);
  assert.match(source,/return fail\(409,'room_changed'\)/);
});
