import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameRoomClient } from '../src/modules/games/online/game-room-client.js';
import { normalizeOnlineXoRoom } from '../src/modules/games/xo/xo-online-session.js';

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

test('online XO mapping exposes learner identities without leaking room tokens into game state',()=>{
  const room={
    status:'playing',version:2,selfPlayerId:'p1',
    players:[{playerId:'p1',learnerId:'yasser'},{playerId:'p2',learnerId:'khaled'}],
    state:{players:['p1','p2'],board:['p1',null,'p2',null,null,null,null,null,null],currentPlayerId:'p2',winner:null,winningLine:[],moveCount:2,round:1,status:'playing'}
  };
  const state=normalizeOnlineXoRoom(room);
  assert.deepEqual(state.players,['yasser','khaled']);
  assert.deepEqual(state.board.slice(0,3),['yasser',null,'khaled']);
  assert.equal(state.currentPlayer,'khaled');
  assert.equal('token' in state,false);
});
