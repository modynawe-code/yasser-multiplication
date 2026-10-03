import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameRoomClient,getGameRoomApiBase } from '../src/modules/games/online/game-room-client.js';
import { createGameRoomResumeStore } from '../src/modules/games/online/game-room-resume-store.js';
import { createOnlineGameSession } from '../src/modules/games/online/game-online-session.js';
import { createRpsOnlineSession,normalizeOnlineRpsRoom } from '../src/modules/games/rps/rps-online-session.js';
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

  await client.joinRoom({code:'123456',learnerId:'mashaal',participationRole:'spectator'});
  assert.deepEqual(JSON.parse(calls[2].options.body),{code:'123456',learnerId:'mashaal',participationRole:'spectator'});
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

test('online RPS mapping keeps projected private choice state and learner identities',()=>{
  const room={
    status:'playing',version:4,selfPlayerId:'p1',
    players:[{playerId:'p1',learnerId:'yasser'},{playerId:'p2',learnerId:'mashaal'}],
    state:{players:['p1','p2'],targetScore:3,round:2,status:'playing',phase:'choosing',choices:{p1:'paper'},chosenPlayers:['p1','p2'],scores:{p1:1,p2:0},roundWinner:null,matchWinner:null,rematchReady:[]}
  };
  const state=normalizeOnlineRpsRoom(room);
  assert.deepEqual(state.players,['yasser','mashaal']);
  assert.deepEqual(state.choices,{yasser:'paper'});
  assert.deepEqual(state.chosenPlayers,['yasser','mashaal']);
  assert.deepEqual(state.scores,{yasser:1,mashaal:0});
});

test('RPS online adapter reuses generic room transport for simultaneous choice actions',async()=>{
  let room={code:'555555',gameId:'rock-paper-scissors',status:'playing',version:1,selfPlayerId:'p1',players:[{playerId:'p1',learnerId:'yasser',seat:0,participationRole:'player',authorityRole:'host'},{playerId:'p2',learnerId:'khaled',seat:1,participationRole:'player',authorityRole:'guest'}],state:{players:['p1','p2'],targetScore:3,round:1,status:'playing',phase:'choosing',choices:{},chosenPlayers:[],scores:{p1:0,p2:0},roundWinner:null,matchWinner:null,rematchReady:[]}};
  const actions=[];
  const roomClient={
    async createRoom(){return{playerToken:'abcdefghijklmnop-secret',room};},
    async joinRoom(){throw new Error('not used');},
    async getRoom(){return{room};},
    async submitAction(input){actions.push(input);room={...room,version:2,state:{...room.state,choices:{p1:input.payload.choice},chosenPlayers:['p1']}};return{room};}
  };
  const store=createGameRoomResumeStore({sessionStorage:memoryStorage(),localStorage:memoryStorage(),gameId:'rock-paper-scissors'});
  const session=createRpsOnlineSession({roomClient,resumeStore:store,autoPoll:false});
  await session.create('yasser');
  await session.choose('rock');
  assert.equal(actions[0].type,'choose');
  assert.deepEqual(actions[0].payload,{choice:'rock'});
  assert.equal(session.hasChosen(),true);
  assert.equal(session.snapshot.rpsState.choices.yasser,'rock');
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
  let room={code:'123456',gameId:'demo-game',status:'waiting',version:0,selfPlayerId:'p1',players:[{playerId:'p1',learnerId:'mashaal',seat:0,participationRole:'player',authorityRole:'host'}],state:{}};
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

test('shared online session preserves spectator participation from room payload',async()=>{
  const room={code:'777777',gameId:'demo-game',status:'playing',version:4,selfPlayerId:'sp1',players:[{playerId:'p1',learnerId:'yasser',seat:0,participationRole:'player',authorityRole:'host'},{playerId:'sp1',learnerId:'mashaal',seat:null,participationRole:'spectator',authorityRole:'guest'}],state:{}};
  const roomClient={
    async createRoom(){throw new Error('not used');},
    async joinRoom({participationRole}){assert.equal(participationRole,'spectator');return{playerToken:'abcdefghijklmnop-secret',room};},
    async getRoom(){return{room};},
    async submitAction(){throw new Error('not used');}
  };
  const store=createGameRoomResumeStore({sessionStorage:memoryStorage(),localStorage:memoryStorage(),gameId:'demo-game'});
  const session=createOnlineGameSession({gameId:'demo-game',roomClient,resumeStore:store,autoPoll:false});
  await session.join('777777','mashaal',{participationRole:'spectator'});
  assert.equal(session.snapshot.participationRole,'spectator');
  assert.equal(session.snapshot.authorityRole,'guest');
});
