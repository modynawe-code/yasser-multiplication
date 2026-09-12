import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameRoomClient,getGameRoomApiBase } from '../src/modules/games/online/game-room-client.js';
import { createGameRoomResumeStore } from '../src/modules/games/online/game-room-resume-store.js';
import { createOnlineGameSession } from '../src/modules/games/online/game-online-session.js';
import { normalizeOnlineXoRoom } from '../src/modules/games/xo/xo-online-session.js';

function memoryStorage(){
  const map=new Map();
  return{
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key),
    key:index=>[...map.keys()][index]??null,
    get length(){return map.size;}
  };
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

  await client.submitAction({code:'123456',token:'secret',expectedVersion:3,type:'drop',payload:{column:5}});
  assert.deepEqual(JSON.parse(calls[1].options.body),{column:5,expectedVersion:3,type:'drop'});
});

test('game rooms keep the production room API when family cloud sync is disabled in preview',()=>{
  const hadFlag=Object.prototype.hasOwnProperty.call(globalThis,'__FAMILY_API_DISABLED__');
  const previous=globalThis.__FAMILY_API_DISABLED__;
  try{
    globalThis.__FAMILY_API_DISABLED__=true;
    assert.equal(getGameRoomApiBase(),'https://yasser-khaled-family-api.modynawe.workers.dev');
  }finally{
    if(hadFlag)globalThis.__FAMILY_API_DISABLED__=previous;
    else delete globalThis.__FAMILY_API_DISABLED__;
  }
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

test('resume store supports any valid learner and game without mixing sessions',()=>{
  const session=memoryStorage(),local=memoryStorage(),store=createGameRoomResumeStore({sessionStorage:session,localStorage:local});
  const expiry=new Date(Date.now()+60000).toISOString();
  const xo={gameId:'xo',code:'123456',token:'abcdefghijklmnop-secret',selfPlayerId:'p1',selfLearnerId:'mashaal',expiresAt:expiry};
  const future={gameId:'connect4',code:'654321',token:'qrstuvwxyzabcdef-secret',selfPlayerId:'p2',selfLearnerId:'yasser',expiresAt:expiry};
  assert.equal(store.save(xo),true);
  assert.equal(store.save(future),true);
  assert.equal(store.load({gameId:'xo'}).selfLearnerId,'mashaal');
  assert.equal(store.load({gameId:'connect4'}).code,'654321');
  store.clear(xo);
  assert.equal(store.load({gameId:'xo'}),null);
  assert.equal(store.load({gameId:'connect4'}).code,'654321');
});

test('shared online session owns host guest resume and generic action transport',async()=>{
  const sessionStorage=memoryStorage(),localStorage=memoryStorage();
  const resumeStore=createGameRoomResumeStore({sessionStorage,localStorage,gameId:'demo-game'});
  let room={code:'123456',gameId:'demo-game',status:'waiting',version:0,selfPlayerId:'p1',players:[{playerId:'p1',learnerId:'mashaal',seat:0}],state:{}};
  const actions=[];
  const roomClient={
    async createRoom({gameId,learnerId}){assert.equal(gameId,'demo-game');assert.equal(learnerId,'mashaal');return{playerToken:'abcdefghijklmnop-secret',room};},
    async joinRoom(){throw new Error('not used');},
    async getRoom(){return{room};},
    async submitAction(input){actions.push(input);room={...room,version:room.version+1,status:'playing'};return{room};}
  };
  const first=createOnlineGameSession({gameId:'demo-game',roomClient,resumeStore,autoPoll:false});
  await first.create('mashaal');
  assert.equal(first.snapshot.authorityRole,'host');
  assert.equal(first.snapshot.participationRole,'player');
  assert.equal(first.snapshot.connected,true);
  await first.submit('drop',{column:2});
  assert.equal(actions[0].type,'drop');
  assert.deepEqual(actions[0].payload,{column:2});
  first.stop();

  const second=createOnlineGameSession({gameId:'demo-game',roomClient,resumeStore,autoPoll:false});
  await second.reconnect();
  assert.equal(second.snapshot.selfLearnerId,'mashaal');
  assert.equal(second.snapshot.authorityRole,'host');
  second.forget();
  assert.equal(resumeStore.has({gameId:'demo-game'}),false);
});
