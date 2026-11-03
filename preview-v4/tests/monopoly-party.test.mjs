import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD,partyActions,partyPortfolioActions,resolvePartyAction,roomCode,tileCoordinates,publicJoinUrl,makePartyConnection} from '../monopoly-party/shared.js';

test('TV board represents each of 40 unique squares including all four corners',()=>{
  assert.equal(BOARD.length,40);
  const coords=Array.from({length:40},(_,i)=>tileCoordinates(i));
  assert.equal(new Set(coords.map(x=>x.row+':'+x.col)).size,40);
  assert.deepEqual([coords[0],coords[10],coords[20],coords[30]],[{row:10,col:10},{row:10,col:0},{row:0,col:0},{row:0,col:10}]);
  assert.throws(()=>tileCoordinates(40),RangeError);
});
test('QR join URLs carry only six-digit room code, never a player token',()=>{
  const url=new URL(publicJoinUrl('001002',{href:'https://example.test/monopoly-party/tv/'}));
  assert.equal(url.pathname,'/monopoly-party/controller/');
  assert.equal(url.searchParams.get('code'),'001002');
  assert.equal(url.searchParams.size,1);
  assert.equal(roomCode('123456'),'123456');
  assert.equal(roomCode('12345'),null);
});
const state=(phase,turnIndex=0)=>({
  status:'playing',phase,turnIndex,
  players:[{id:'host',name:'الأول',cash:1500},{id:'guest',name:'الثاني',cash:1400}],
  pending:phase==='card'?{stage:'deck'}:null,
  auction:{nextIndex:1,bid:40},
  tradeOffer:phase==='trade'?{targetId:'guest'}:null
});
test('phone sees only authorized turn actions and spectator has no controller',()=>{
  assert.deepEqual(partyActions({status:'waiting',players:[{id:'host'},{id:'guest'}]},'host').map(x=>x.type),['start']);
  assert.deepEqual(partyActions({status:'waiting',players:[{id:'host'},{id:'guest'}]},'guest'),[]);
  assert.deepEqual(partyActions(state('roll'),'host').map(x=>x.type),['roll']);
  assert.deepEqual(partyActions(state('roll'),'guest'),[]);
  assert.deepEqual(partyActions(state('property'),'host').map(x=>x.type),['buy','skip']);
  assert.deepEqual(partyActions(state('auction'),'guest').map(x=>x.type),['bid','pass-auction']);
  assert.deepEqual(partyActions(state('auction'),'host'),[]);
  assert.deepEqual(partyActions(state('card'),'host').map(x=>x.type),['card-pick']);
  assert.deepEqual(partyActions({...state('card'),pending:{stage:'back'}},'host').map(x=>x.type),['card-flip']);
  assert.deepEqual(partyActions({...state('card'),pending:{stage:'face'}},'host').map(x=>x.type),['card']);
  assert.deepEqual(partyActions(state('trade'),'guest').map(x=>x.type),['trade-accept','trade-reject']);
  assert.deepEqual(partyActions(state('trade'),'host'),[]);
  assert.deepEqual(partyActions(state('end'),'host').map(x=>x.type),['end']);
  assert.deepEqual(partyActions(state('roll'),'fake-player'),[]);
});
test('spectator may join and resume but cannot create or issue player commands',async()=>{
  const map=new Map();
  const store={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
  let joinedOptions=null;
  const client={
    joinRoom:async params=>{
      joinedOptions=params;
      return{playerToken:'mock-separate-private-token',room:{code:'123456',gameId:'family-monopoly',version:1,selfPlayerId:'tv-id',state:{status:'waiting',players:[{id:'host'}]}}};
    },
    createRoom:async()=>{throw new Error('should never create as spectator');},
    submitAction:async()=>{throw new Error('should never submit as spectator');},
    getRoom:async()=>({room:{code:'123456',gameId:'family-monopoly',version:2,selfPlayerId:'tv-id',state:{status:'waiting',players:[{id:'host'}]}}})
  };
  const conn=makePartyConnection({role:'spectator',client,storage:store});
  await assert.rejects(conn.create('TV'),/spectator cannot create/);
  await conn.join('123456','TV');
  assert.equal(joinedOptions.participationRole,'spectator');
  assert.equal(conn.room.code,'123456');
  await assert.rejects(conn.action('roll'),/spectator actions are forbidden/);
  const second=makePartyConnection({role:'spectator',client,storage:store});
  await second.resume();
  assert.equal(second.room.version,2);
  second.leave();conn.leave();
});

test('property manager restricts building, selling and trading to the owner at valid phases',()=>{
  const game={
    ...state('end'),
    ownership:{1:{ownerId:'host',houses:2},3:{ownerId:'host',houses:0}},
    players:[{id:'host',name:'الأول',cash:1000},{id:'guest',name:'الثاني',cash:800}]
  };
  assert.deepEqual(partyPortfolioActions(game,'guest'),[]);
  const actions=partyPortfolioActions(game,'host');
  assert.equal(actions.filter(a=>a.type==='build').length,2);
  assert.equal(actions.filter(a=>a.type==='sell').length,2);
  assert.equal(actions.filter(a=>a.type==='trade').length,2);
  assert.equal(resolvePartyAction(game,'host','build',{index:1}).type,'build');
  assert.equal(resolvePartyAction(game,'host','sell',{index:3}).type,'sell');
  assert.equal(resolvePartyAction(game,'host','trade',{index:3}).type,'trade');
  assert.equal(resolvePartyAction(game,'host','sell',{index:2}),null);
  assert.equal(resolvePartyAction(game,'guest','trade',{index:3}),null);
  assert.equal(partyPortfolioActions({...game,phase:'roll'},'host').filter(a=>a.type==='sell').length,0);
  assert.equal(partyPortfolioActions({...game,phase:'roll'},'host').filter(a=>a.type==='build').length,2);
  assert.equal(partyPortfolioActions({...game,phase:'property'},'host').length,0);
  assert.equal(partyPortfolioActions({...game,players:[{id:'host',name:'الأول',cash:10},game.players[1]]},'host').filter(a=>a.type==='build').length,0);
});
test('duplicate room versions cannot replay a camera movement or UI callback',async()=>{
  const storage=new Map();
  const state={status:'waiting',players:[{id:'host'}]};
  let received=0,lookups=0;
  const client={
    createRoom:async()=>({playerToken:'secret',room:{code:'123456',gameId:'family-monopoly',version:0,selfPlayerId:'host',state}}),
    getRoom:async()=>{lookups++;return{room:{code:'123456',gameId:'family-monopoly',version:0,selfPlayerId:'host',state}};}
  };
  const session=makePartyConnection({role:'player',client,
    storage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    onRoom:()=>received++});
  await session.create('host');
  assert.equal(received,1);
  await new Promise(resolve=>setTimeout(resolve,1400));
  assert.ok(lookups>=1);
  assert.equal(received,1);
  session.leave();
});
test('TV-only viewer is unable to authorize owner property mutations',async()=>{
  const state={...state('end'),ownership:{1:{ownerId:'host',houses:0},3:{ownerId:'host',houses:0}}};
  assert.equal(resolvePartyAction(state,'guest','sell',{index:3}),null);
  assert.equal(resolvePartyAction(state,'nonexistent','build',{index:3}),null);
});
