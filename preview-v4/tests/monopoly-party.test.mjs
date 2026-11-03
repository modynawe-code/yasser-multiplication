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
  const game={...state('end'),ownership:{1:{ownerId:'host',houses:0},3:{ownerId:'host',houses:0}}};
  assert.equal(resolvePartyAction(game,'guest','sell',{index:3}),null);
  assert.equal(resolvePartyAction(game,'nonexistent','build',{index:3}),null);
});

test('native Android TV QR opens the public phone controller, not localhost',()=>{
  const old=globalThis.__MONOPOLY_PUBLIC_CONTROLLER_URL__;
  globalThis.__MONOPOLY_PUBLIC_CONTROLLER_URL__='https://monopoly-tv-staging.modynawe.workers.dev/monopoly-party/controller/';
  try{
    const link=publicJoinUrl('009123',{origin:'https://localhost',href:'https://localhost/monopoly-party/tv/'});
    assert.equal(new URL(link).origin,'https://monopoly-tv-staging.modynawe.workers.dev');
    assert.equal(new URL(link).searchParams.get('code'),'009123');
    assert.ok(!link.includes('localhost'));
    const web=publicJoinUrl('009123',{origin:'https://monopoly-tv-staging.modynawe.workers.dev',href:'https://monopoly-tv-staging.modynawe.workers.dev/monopoly-party/tv/'});
    assert.equal(new URL(web).origin,'https://monopoly-tv-staging.modynawe.workers.dev');
  }finally{
    if(old===undefined)delete globalThis.__MONOPOLY_PUBLIC_CONTROLLER_URL__;
    else globalThis.__MONOPOLY_PUBLIC_CONTROLLER_URL__=old;
  }
});

test('owner can mortgage and redeem property only within the rules and available funds',()=>{
  const game={
    ...state('end'),
    ownership:{5:{ownerId:'host',houses:0,mortgaged:false}},
    players:[{id:'host',name:'الأول',cash:1000},{id:'guest',name:'الثاني',cash:800}]
  };
  const possible=partyPortfolioActions(game,'host');
  assert.equal(possible.find(x=>x.type==='mortgage')?.index,5);
  assert.equal(partyPortfolioActions(game,'guest').length,0);
  assert.equal(resolvePartyAction(game,'guest','mortgage',{index:5}),null);
  assert.equal(resolvePartyAction(game,'host','mortgage',{index:5}).type,'mortgage');
  game.ownership[5].mortgaged=true;
  assert.equal(partyPortfolioActions(game,'host').some(x=>x.type==='mortgage'),false);
  assert.equal(partyPortfolioActions(game,'host').some(x=>x.type==='unmortgage'),true);
  game.players[0].cash=0;
  assert.equal(partyPortfolioActions(game,'host').some(x=>x.type==='unmortgage'),false);
  assert.equal(partyPortfolioActions({...game,phase:'property'},'host').length,0);
});

test('host START retries only an optimistic version conflict caused by another player joining',async()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const waiting={status:'waiting',players:[{id:'host'},{id:'guest'}]};
  const room=(version,status='waiting')=>({code:'123456',gameId:'family-monopoly',version,status,selfPlayerId:'host',state:status==='waiting'?waiting:{...waiting,status:'playing',phase:'roll',turnIndex:0}});
  let attempts=0;
  const client={
    createRoom:async()=>({playerToken:'secret',room:room(1)}),
    submitAction:async({expectedVersion,type})=>{
      attempts++;assert.equal(type,'start');
      if(attempts===1){
        assert.equal(expectedVersion,1);
        throw Object.assign(new Error('stale'),{status:409,body:{error:'version_conflict',room:room(2)}});
      }
      assert.equal(expectedVersion,2);
      return {room:room(3,'playing')};
    }
  };
  const connection=makePartyConnection({role:'player',client,storage});
  await connection.create('مضيف');
  assert.equal((await connection.action('start')).status,'playing');
  assert.equal(attempts,2);
  connection.leave();
});
