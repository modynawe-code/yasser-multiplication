import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

const BASE=process.env.TV_LOCAL_API||'http://127.0.0.1:8789';
const ORIGIN='http://127.0.0.1:8790';
const slug=label=>label+'-'+randomBytes(4).toString('hex');
async function request(path,{body,token}={}){
  const headers={'content-type':'application/json','origin':ORIGIN};
  if(token)headers['x-game-token']=token;
  const r=await fetch(BASE+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
  assert.equal(r.headers.get('access-control-allow-origin'),ORIGIN,'CORS origin is not allowed');
  return {status:r.status,json:await r.json()};
}
const create=await request('/v1/games/rooms',{body:{gameId:'family-monopoly',learnerId:slug('phone-host'),displayName:'مضيف'}});
assert.equal(create.status,201,JSON.stringify(create.json));
const room=create.json.room,token1=create.json.playerToken;
assert.match(room.code,/^[0-9]{6}$/);assert.ok(token1);assert.equal(room.gameId,'family-monopoly');
const spect=await request('/v1/games/rooms/join',{body:{code:room.code,learnerId:slug('tv-screen'),displayName:'شاشة التلفزيون',participationRole:'spectator'}});
assert.equal(spect.status,200,JSON.stringify(spect.json));
assert.equal(spect.json.room.players.filter(x=>x.participationRole==='player').length,1);
const tokenTV=spect.json.playerToken;
const guest=await request('/v1/games/rooms/join',{body:{code:room.code,learnerId:slug('phone-guest'),displayName:'ضيف',participationRole:'player'}});
assert.equal(guest.status,200,JSON.stringify(guest.json));
const token2=guest.json.playerToken;
const spectatorAction=await request('/v1/games/rooms/'+room.code+'/actions',{token:tokenTV,body:{expectedVersion:guest.json.room.version,type:'roll'}});
assert.equal(spectatorAction.status,403,JSON.stringify(spectatorAction.json));
const badToken=await request('/v1/games/rooms/'+room.code,{token:'bad-secret'});
assert.equal(badToken.status,401);
const start=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:guest.json.room.version,type:'start'}});
assert.equal(start.status,200,JSON.stringify(start.json));
assert.equal(start.json.room.state.status,'playing');
assert.equal(start.json.room.state.players.length,2);
const guestRoll=await request('/v1/games/rooms/'+room.code+'/actions',{token:token2,body:{expectedVersion:start.json.room.version,type:'roll'}});
assert.equal(guestRoll.status,409);assert.equal(guestRoll.json.error,'not-your-turn');
const roll=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:start.json.room.version,type:'roll'}});
assert.equal(roll.status,200,JSON.stringify(roll.json));
assert.equal(roll.json.room.state.dice.length,2);
assert.ok(roll.json.room.state.dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6));
const repeated=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:start.json.room.version,type:'roll'}});
assert.equal(repeated.status,409,'stale action must not be applied');
assert.equal(repeated.json.error,'version_conflict');
const spectatorSnapshot=await request('/v1/games/rooms/'+room.code,{token:tokenTV});
assert.equal(spectatorSnapshot.status,200);
assert.deepEqual(spectatorSnapshot.json.room.state.players,roll.json.room.state.players);
assert.equal(spectatorSnapshot.json.room.version,roll.json.room.version);
assert.ok(!JSON.stringify(spectatorSnapshot.json.room).includes(token1));
assert.ok(!JSON.stringify(spectatorSnapshot.json.room).includes(token2));
assert.ok(spectatorSnapshot.json.room.players.filter(x=>x.participationRole==='spectator').length===1);
let last=roll.json.room;
if(last.state.phase==='property'){
  const buy=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:last.version,type:'buy'}});
  assert.equal(buy.status,200,JSON.stringify(buy.json));
  last=buy.json.room;
}
if(last.state.phase==='card'){
  for(const type of ['card-pick','card-flip','card']){
    const action=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:last.version,type}});
    assert.equal(action.status,200,JSON.stringify(action.json));last=action.json.room;
  }
}
if(last.state.phase==='end'){
  const end=await request('/v1/games/rooms/'+room.code+'/actions',{token:token1,body:{expectedVersion:last.version,type:'end'}});
  assert.equal(end.status,200,JSON.stringify(end.json));
  assert.equal(end.json.room.state.players[end.json.room.state.turnIndex].id,guest.json.room.selfPlayerId);
  last=end.json.room;
}
const resume=await request('/v1/games/rooms/'+room.code,{token:token2});
assert.equal(resume.status,200);
assert.equal(resume.json.room.version,last.version);
console.log('Monopoly TV LIVE LOCAL Worker/D1 contract: PASSED',JSON.stringify({
  room:'six-digit-token-redacted',players:2,spectators:1,
  actionRoute:'start/roll/conditional-buy-or-card/end',version:last.version,phase:last.state.phase,
  staleAction:'rejected',unauthorizedSpectator:'rejected',crossOrigin:'allowed',resume:'pass'
}));
