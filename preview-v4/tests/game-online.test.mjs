import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameRoomClient } from '../src/modules/games/online/game-room-client.js';
import { createGameRoomResumeStore } from '../src/modules/games/online/game-room-resume-store.js';
import { normalizeOnlineXoRoom } from '../src/modules/games/xo/xo-online-session.js';

function memoryStorage(){
  const map=new Map();
  return{getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};
}

test('game room client uses temporary game token and optimistic version contract',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({room:{code:'123456',version:3}}),{status:200,headers:{'content-type':'application/json'}});};
  const client=createGameRoomClient({baseUrl:'https://example.test',fetchImpl});
  await client.submitAction({code:'123456',token:'secret',expectedVersion:2,type:'move',cell:4});
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://example.test/v1/games/rooms/123456/actions');
  assert.equal(calls[0].options.headers['x-game-token'],'secret');
  assert.deepEqual(JSON.parse(calls[0].options.body),{expectedVersion:2,type:'move',cell:4});
});

test('online XO mapping exposes learner identities and mutual rematch readiness',()=>{
  const room={
    status:'won',version:3,selfPlayerId:'p1',
    players:[{playerId:'p1',learnerId:'yasser'},{playerId:'p2',learnerId:'khaled'}],
    state:{players:['p1','p2'],board:['p1',null,'p2',null,null,null,null,null,null],currentPlayerId:null,winner:'p1',winningLine:[0,4,8],rematchReady:['p2'],moveCount:5,round:1,status:'won'}
  };
  const state=normalizeOnlineXoRoom(room);
  assert.deepEqual(state.players,['yasser','khaled']);
  assert.deepEqual(state.board.slice(0,3),['yasser',null,'khaled']);
  assert.equal(state.winner,'yasser');
  assert.deepEqual(state.rematchReady,['khaled']);
  assert.equal('token' in state,false);
});

test('resume store keeps each device room capability resumable without mixing learners',()=>{
  const session=memoryStorage(),local=memoryStorage(),store=createGameRoomResumeStore({sessionStorage:session,localStorage:local});
  const record={gameId:'xo',code:'123456',token:'abcdefghijklmnop-secret',selfPlayerId:'p1',selfLearnerId:'yasser',expiresAt:new Date(Date.now()+60000).toISOString()};
  assert.equal(store.save(record),true);
  assert.equal(store.has(),true);
  assert.equal(store.load().code,'123456');
  assert.equal(store.load().selfLearnerId,'yasser');
  store.clear(record);
  assert.equal(store.load(),null);
});
