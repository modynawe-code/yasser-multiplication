import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameHistoryService} from '../src/modules/games/history/game-history-service.js';

function makeStorage(){
  const map=new Map();
  return{
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key)
  };
}

test('local game result posts one generic match contract to the server',async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=makeStorage();
  const calls=[];
  const service=createGameHistoryService({fetchImpl:async(url,options)=>{calls.push({url,options});return{ok:true,status:201,json:async()=>({ok:true,matchId:'saved-1'})};}});
  try{
    const result=await service.recordGameResult({
      matchId:'local-test-1',gameId:'future-game',startedAt:'2026-09-25T18:00:00Z',endedAt:'2026-09-25T18:05:00Z',
      winnerIds:['yasser'],players:[{learnerId:'yasser',displayName:'ياسر',score:4,outcome:'win'}],details:{rounds:1}
    });
    assert.equal(result.ok,true);assert.equal(result.queued,false);assert.equal(calls.length,1);
    assert.match(calls[0].url,/\/v1\/games\/history$/);
    const body=JSON.parse(calls[0].options.body);
    assert.equal(body.gameId,'future-game');assert.equal(body.playMode,'local');assert.equal(body.players[0].learnerId,'yasser');
  }finally{globalThis.localStorage=old;}
});

test('failed local result is queued and later flushed without changing match id',async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=makeStorage();
  let online=false;const seen=[];
  const service=createGameHistoryService({fetchImpl:async(_url,options)=>{const body=JSON.parse(options.body);seen.push(body.matchId);if(!online)throw new Error('offline');return{ok:true,status:200,json:async()=>({ok:true})};}});
  try{
    const first=await service.recordGameResult({matchId:'offline-1',gameId:'xo',winnerIds:[],players:[{learnerId:'yasser',displayName:'ياسر',outcome:'draw'}]});
    assert.equal(first.queued,true);assert.equal(service.pendingCount(),1);
    online=true;const flushed=await service.flushPending();assert.equal(flushed.ok,true);assert.equal(service.pendingCount(),0);
    assert.deepEqual(seen,['offline-1','offline-1']);
  }finally{globalThis.localStorage=old;}
});

test('history and stats readers use server endpoints',async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=makeStorage();
  const urls=[];const service=createGameHistoryService({fetchImpl:async(url)=>{urls.push(url);return{ok:true,status:200,json:async()=>({matches:[],players:[]})};}});
  try{
    await service.getHistory({limit:42});await service.getStats({days:30});
    assert.ok(urls.some(url=>url.includes('/v1/games/history?limit=42')));
    assert.ok(urls.some(url=>url.includes('/v1/games/stats?days=30')));
  }finally{globalThis.localStorage=old;}
});
