import { randomId, randomSessionToken, sha256Base64Url } from './security.mjs';
import { normalizeLearnerSlug } from './learners.mjs';
import { getGameRoomRules } from './game-room-rules.mjs';
export { addXoRoomGuest, applyXoRoomAction, createInitialXoRoomState } from './game-room-rules.mjs';

const ROOM_TTL_MINUTES=30;
const MAX_RECENT_ROOMS_PER_IP=10;
const MAX_JOIN_ATTEMPTS=20;
const JOIN_WINDOW_MINUTES=10;
const JOIN_BLOCK_MINUTES=15;
const DEFAULT_DISPLAY_NAMES=Object.freeze({yasser:'ياسر',khaled:'خالد',mashaal:'مشاعل'});

const nowIso=()=>new Date().toISOString();
const futureIso=minutes=>new Date(Date.now()+minutes*60000).toISOString();
function validLearner(value){return Boolean(normalizeLearnerSlug(value));}
function normalizeDisplayName(value,learnerId){
  const fallback=DEFAULT_DISPLAY_NAMES[learnerId]||learnerId;
  const text=String(value||fallback).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,40);
  return text||fallback;
}
function normalizeCode(value){return String(value||'').replace(/\D/g,'').slice(0,6);}
function clientIp(request){return request.headers.get('CF-Connecting-IP')||'unknown';}

export function generateRoomCode(){
  const values=new Uint32Array(1);crypto.getRandomValues(values);
  return String(values[0]%1000000).padStart(6,'0');
}

async function roomByCode(env,code){
  return env.DB.prepare('SELECT id,code,game_id,status,state_json,version,expires_at,created_at,updated_at FROM game_rooms WHERE code=?').bind(code).first();
}
async function playersForRoom(env,roomId){
  const rows=await env.DB.prepare('SELECT player_id,learner_id,display_name,seat FROM game_room_players WHERE room_id=? ORDER BY seat').bind(roomId).all();return rows.results||[];
}
async function roomPayload(env,row,selfPlayerId=null){
  let state;try{state=JSON.parse(row.state_json);}catch{state=null;}
  return{code:row.code,gameId:row.game_id,status:row.status,version:Number(row.version||0),expiresAt:row.expires_at,state,players:(await playersForRoom(env,row.id)).map(item=>({playerId:item.player_id,learnerId:item.learner_id,name:item.display_name,seat:item.seat})),selfPlayerId};
}
async function playerForToken(env,roomId,token){
  if(!token)return null;const hash=await sha256Base64Url(token);
  return env.DB.prepare('SELECT player_id,learner_id,display_name,seat FROM game_room_players WHERE room_id=? AND token_hash=?').bind(roomId,hash).first();
}
async function creatorKey(request){return sha256Base64Url(`game-room|${clientIp(request)}`);}
async function allowCreate(request,env){
  const key=await creatorKey(request),since=new Date(Date.now()-10*60000).toISOString();
  const row=await env.DB.prepare('SELECT COUNT(*) AS count FROM game_rooms WHERE creator_key=? AND created_at>?').bind(key,since).first();
  return{ok:Number(row?.count||0)<MAX_RECENT_ROOMS_PER_IP,key};
}
async function joinThrottleKey(request){return sha256Base64Url(`game-room-join|${clientIp(request)}`);}
async function joinThrottleStatus(env,key){
  const row=await env.DB.prepare('SELECT attempts,window_started_at,blocked_until FROM game_room_join_throttle WHERE throttle_key=?').bind(key).first();
  if(!row)return{blocked:false,row:null};
  return{blocked:Boolean(row.blocked_until&&Date.parse(row.blocked_until)>Date.now()),row};
}
async function recordJoinFailure(env,key){
  const current=await joinThrottleStatus(env,key),now=Date.now();let attempts=1,windowStarted=new Date(now).toISOString();
  if(current.row&&now-Date.parse(current.row.window_started_at)<JOIN_WINDOW_MINUTES*60000){attempts=Number(current.row.attempts||0)+1;windowStarted=current.row.window_started_at;}
  const blockedUntil=attempts>=MAX_JOIN_ATTEMPTS?new Date(now+JOIN_BLOCK_MINUTES*60000).toISOString():null;
  await env.DB.prepare('INSERT INTO game_room_join_throttle(throttle_key,attempts,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(throttle_key) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until').bind(key,attempts,windowStarted,blockedUntil).run();
}
async function clearJoinThrottle(env,key){await env.DB.prepare('DELETE FROM game_room_join_throttle WHERE throttle_key=?').bind(key).run().catch(()=>null);}

async function createRoom(request,env,respond,readJson){
  const body=await readJson(request),gameId=String(body?.gameId||''),learnerId=normalizeLearnerSlug(body?.learnerId),displayName=normalizeDisplayName(body?.displayName,learnerId),rules=getGameRoomRules(gameId);
  if(!rules||!validLearner(learnerId))return respond(400,{error:'invalid_game_room'});
  const throttle=await allowCreate(request,env);if(!throttle.ok)return respond(429,{error:'too_many_rooms'});
  const roomId=randomId('grm'),playerId=randomId('gpl'),playerToken=randomSessionToken(),tokenHash=await sha256Base64Url(playerToken),createdAt=nowIso(),expiresAt=futureIso(ROOM_TTL_MINUTES),state=rules.createInitialState(playerId);
  let code=null;
  for(let attempt=0;attempt<12;attempt++){
    const candidate=generateRoomCode();
    try{
      await env.DB.batch([
        env.DB.prepare('INSERT INTO game_rooms(id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(roomId,candidate,gameId,state.status,JSON.stringify(state),0,throttle.key,expiresAt,createdAt,createdAt),
        env.DB.prepare('INSERT INTO game_room_players(room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?)').bind(roomId,playerId,learnerId,displayName,tokenHash,0,createdAt,createdAt)
      ]);
      code=candidate;break;
    }catch(error){if(!String(error?.message||error).toLowerCase().includes('unique'))throw error;}
  }
  if(!code)return respond(503,{error:'room_code_unavailable'});
  const row=await roomByCode(env,code);return respond(201,{playerToken,room:await roomPayload(env,row,playerId)});
}

async function joinRoom(request,env,respond,readJson){
  const body=await readJson(request),code=normalizeCode(body?.code),learnerId=normalizeLearnerSlug(body?.learnerId),displayName=normalizeDisplayName(body?.displayName,learnerId);
  if(code.length!==6||!validLearner(learnerId))return respond(400,{error:'invalid_join_request'});
  const throttleKey=await joinThrottleKey(request),throttle=await joinThrottleStatus(env,throttleKey);if(throttle.blocked)return respond(429,{error:'too_many_join_attempts'});
  const fail=async(status,error,extra={})=>{await recordJoinFailure(env,throttleKey);return respond(status,{error,...extra});};
  const row=await roomByCode(env,code);if(!row||Date.parse(row.expires_at)<=Date.now())return fail(404,'room_not_found');
  const rules=getGameRoomRules(row.game_id);if(!rules)return fail(409,'unsupported_game_room');
  if(row.status!=='waiting')return fail(409,'room_not_waiting',{room:await roomPayload(env,row)});
  const existing=await playersForRoom(env,row.id);if(existing.some(item=>item.learner_id===learnerId))return fail(409,'learner_already_in_room');
  if(existing.length>=rules.maxPlayers)return fail(409,'room_full');
  let state;try{state=JSON.parse(row.state_json);}catch{return respond(500,{error:'invalid_room_state'});}
  const usedSeats=new Set(existing.map(item=>Number(item.seat))),seat=Array.from({length:rules.maxPlayers},(_,index)=>index).find(index=>!usedSeats.has(index));
  if(seat===undefined)return fail(409,'room_full');
  const playerId=randomId('gpl'),playerToken=randomSessionToken(),tokenHash=await sha256Base64Url(playerToken),joinedAt=nowIso(),next=rules.addPlayer(state,playerId);if(!next.ok)return fail(409,next.reason);
  const insert=await env.DB.prepare('INSERT OR IGNORE INTO game_room_players(room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?)').bind(row.id,playerId,learnerId,displayName,tokenHash,seat,joinedAt,joinedAt).run();
  if(Number(insert?.meta?.changes||0)!==1)return fail(409,'room_full');
  const update=await env.DB.prepare('UPDATE game_rooms SET status=?,state_json=?,version=version+1,updated_at=?,expires_at=? WHERE id=? AND version=?').bind(next.state.status,JSON.stringify(next.state),joinedAt,futureIso(ROOM_TTL_MINUTES),row.id,row.version).run();
  if(Number(update?.meta?.changes||0)!==1){
    await env.DB.prepare('DELETE FROM game_room_players WHERE room_id=? AND player_id=?').bind(row.id,playerId).run().catch(()=>null);
    return fail(409,'room_changed');
  }
  await clearJoinThrottle(env,throttleKey);
  const fresh=await roomByCode(env,code);return respond(200,{playerToken,room:await roomPayload(env,fresh,playerId)});
}

async function getRoom(request,env,respond,code){
  const row=await roomByCode(env,code);if(!row||Date.parse(row.expires_at)<=Date.now())return respond(404,{error:'room_not_found'});
  const player=await playerForToken(env,row.id,request.headers.get('x-game-token')||'');if(!player)return respond(401,{error:'invalid_game_token'});
  env.DB.prepare('UPDATE game_room_players SET last_seen_at=? WHERE room_id=? AND player_id=?').bind(nowIso(),row.id,player.player_id).run().catch(()=>null);
  return respond(200,{room:await roomPayload(env,row,player.player_id)});
}

async function submitAction(request,env,respond,readJson,code){
  const row=await roomByCode(env,code);if(!row||Date.parse(row.expires_at)<=Date.now())return respond(404,{error:'room_not_found'});
  const player=await playerForToken(env,row.id,request.headers.get('x-game-token')||'');if(!player)return respond(401,{error:'invalid_game_token'});
  const rules=getGameRoomRules(row.game_id);if(!rules)return respond(409,{error:'unsupported_game_room'});
  const body=await readJson(request),expectedVersion=Number(body?.expectedVersion),type=String(body?.type||''),payload={...(body||{})};delete payload.expectedVersion;delete payload.type;
  if(!Number.isInteger(expectedVersion)||expectedVersion!==Number(row.version))return respond(409,{error:'version_conflict',room:await roomPayload(env,row,player.player_id)});
  let state;try{state=JSON.parse(row.state_json);}catch{return respond(500,{error:'invalid_room_state'});}
  const result=rules.applyAction(state,{playerId:player.player_id,type,payload});if(!result.ok)return respond(409,{error:result.reason,room:await roomPayload(env,row,player.player_id)});
  const updatedAt=nowIso(),expiresAt=futureIso(ROOM_TTL_MINUTES),update=await env.DB.prepare('UPDATE game_rooms SET status=?,state_json=?,version=version+1,updated_at=?,expires_at=? WHERE id=? AND version=?').bind(result.state.status,JSON.stringify(result.state),updatedAt,expiresAt,row.id,row.version).run();
  if(Number(update?.meta?.changes||0)!==1){const fresh=await roomByCode(env,code);return respond(409,{error:'version_conflict',room:await roomPayload(env,fresh,player.player_id)});}
  const fresh=await roomByCode(env,code);return respond(200,{room:await roomPayload(env,fresh,player.player_id)});
}

export async function handleGameRoomRequest({request,env,respond,readJson}){
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
  if(url.pathname==='/v1/games/rooms'&&request.method==='POST')return createRoom(request,env,respond,readJson);
  if(url.pathname==='/v1/games/rooms/join'&&request.method==='POST')return joinRoom(request,env,respond,readJson);
  const code=normalizeCode(parts[3]);if(parts[0]==='v1'&&parts[1]==='games'&&parts[2]==='rooms'&&code.length===6){
    if(parts.length===4&&request.method==='GET')return getRoom(request,env,respond,code);
    if(parts.length===5&&parts[4]==='actions'&&request.method==='POST')return submitAction(request,env,respond,readJson,code);
  }
  return null;
}
