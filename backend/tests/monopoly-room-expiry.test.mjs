import test from 'node:test';
import assert from 'node:assert/strict';
import {handleGameRoomRequest} from '../src/game-rooms.mjs';
import {sha256Base64Url} from '../src/security.mjs';
async function readRoom({gameId='family-monopoly',remainingMinutes=30,valid=true,status='playing'}={}){
 const token='test-token-123456789',hash=await sha256Base64Url(token),writes=[];
 const row={id:'room-id',code:'123456',game_id:gameId,status,version:12,state_json:JSON.stringify({version:2,status,players:[],ownership:{}}),expires_at:new Date(Date.now()+remainingMinutes*60000).toISOString()};
 const env={DB:{prepare(sql){let values;return{bind(...args){values=args;return this},async first(){if(sql.includes('FROM game_rooms WHERE'))return{...row};if(sql.includes('token_hash'))return valid&&values[1]===hash?{player_id:'host',learner_id:'yasser'}:null;return null},async all(){return{results:[]}},async run(){writes.push({sql,values});return{meta:{changes:1}}}}}}};
 const response=await handleGameRoomRequest({request:new Request('https://example.test/v1/games/rooms/123456',{headers:{'x-game-token':token}}),env,respond:(status,body)=>({status,body}),readJson:async()=>null});return{response,writes,row};
}
test('authenticated Monopoly presence extends a short room to 24 hours without changing game version',async()=>{
 const {response,writes}=await readRoom();assert.equal(response.status,200);assert.equal(response.body.room.version,12);
 const remaining=Date.parse(response.body.room.expiresAt)-Date.now();assert.ok(remaining>86390000&&remaining<=86400000);assert.equal(writes.filter(x=>x.sql.includes('SET expires_at')).length,1);
});
test('presence renewal is throttled when expiry already has almost 24 hours left',async()=>{const {writes}=await readRoom({remainingMinutes:1439});assert.equal(writes.filter(x=>x.sql.includes('SET expires_at')).length,0)});
test('unauthenticated presence cannot renew a room',async()=>{const {response,writes}=await readRoom({valid:false});assert.equal(response.status,401);assert.equal(writes.length,0)});
test('expired rooms stay expired rather than being silently resurrected',async()=>{const {response,writes}=await readRoom({remainingMinutes:-1});assert.equal(response.status,404);assert.equal(writes.length,0)});
test('other games retain their existing room lifetime',async()=>{const {response,writes}=await readRoom({gameId:'xo'});assert.equal(response.status,200);assert.equal(writes.filter(x=>x.sql.includes('SET expires_at')).length,0)});
