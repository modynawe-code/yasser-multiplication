import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD,partyActions,roomCode,tileCoordinates,publicJoinUrl,makePartyConnection} from '../monopoly-party/shared.js';

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
