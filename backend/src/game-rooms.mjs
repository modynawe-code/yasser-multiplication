import { randomId, randomSessionToken, sha256Base64Url } from './security.mjs';

const ROOM_TTL_MINUTES=30;
const MAX_RECENT_ROOMS_PER_IP=10;
const DISPLAY_NAMES=Object.freeze({yasser:'ياسر',khaled:'خالد'});
const WIN_LINES=Object.freeze([[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]);

const nowIso=()=>new Date().toISOString();
const futureIso=minutes=>new Date(Date.now()+minutes*60000).toISOString();
function validLearner(value){return value==='yasser'||value==='khaled';}
function validGame(value){return value==='xo';}
function normalizeCode(value){return String(value||'').replace(/\D/g,'').slice(0,6);}
function clone(value){return JSON.parse(JSON.stringify(value));}
function winningLine(board,playerId){return WIN_LINES.find(line=>line.every(index=>board[index]===playerId))||null;}
function otherPlayer(state,playerId){return state.players.find(id=>id!==playerId)||null;}
function clientIp(request){return request.headers.get('CF-Connecting-IP')||'unknown';}

export function generateRoomCode(){
  const values=new Uint32Array(1);crypto.getRandomValues(values);
  return String(values[0]%1000000).padStart(6,'0');
}

export function createInitialXoRoomState(hostPlayerId){
  return Object.freeze({gameId:'xo',status:'waiting',players:Object.freeze([hostPlayerId]),board:Object.freeze(Array(9).fill(null)),currentPlayerId:null,winner:null,winningLine:Object.freeze([]),moveCount:0,round:1});
}

export function addXoRoomGuest(state,guestPlayerId){
  if(state?.gameId!=='xo'||state.status!=='waiting'||state.players.length!==1)return{ok:false,reason:'room-not-waiting'};
  const next=clone(state);next.players.push(guestPlayerId);next.status='playing';next.currentPlayerId=next.players[0];
  return{ok:true,state:next};
}

export function applyXoRoomAction(state,{playerId,type,cell}={}){
  if(state?.gameId!=='xo')return{ok:false,reason:'invalid-game-state'};
  if(type==='reset'){
    if(!['won','draw'].includes(state.status))return{ok:false,reason:'game-not-finished'};
    if(!state.players.includes(playerId))return{ok:false,reason:'player-not-in-room'};
    const next=clone(state),nextRound=Number(next.round||1)+1;
    next.status='playing';next.board=Array(9).fill(null);next.moveCount=0;next.winner=null;next.winningLine=[];next.round=nextRound;next.currentPlayerId=next.players[(nextRound-1)%next.players.length];
    return{ok:true,state:next};
  }
  if(state.status!=='playing')return{ok:false,reason:'game-not-playing'};
  if(state.currentPlayerId!==playerId)return{ok:false,reason:'not-your-turn'};
  if(type==='pass'){
    const next=clone(state),other=otherPlayer(next,playerId);if(!other)return{ok:false,reason:'missing-opponent'};
    next.currentPlayerId=other;return{ok:true,state:next};
  }
  if(type!=='move')return{ok:false,reason:'unsupported-action'};
  const index=Number(cell);if(!Number.isInteger(index)||index<0||index>8)return{ok:false,reason:'invalid-cell'};
  if(state.board[index])return{ok:false,reason:'occupied-cell'};
  const next=clone(state);next.board[index]=playerId;next.moveCount+=1;
  const line=winningLine(next.board,playerId);
  if(line){next.status='won';next.winner=playerId;next.winningLine=line;next.currentPlayerId=null;return{ok:true,state:next};}
  if(next.moveCount>=9){next.status='draw';next.currentPlayerId=null;return{ok:true,state:next};}
  next.currentPlayerId=otherPlayer(next,playerId);return{ok:true,state:next};
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

async function createRoom(request,env,respond,readJson){
  const body=await readJson(request),gameId=String(body?.gameId||''),learnerId=String(body?.learnerId||'');
  if(!validGame(gameId)||!validLearner(learnerId))return respond(400,{error:'invalid_game_room'});
  const throttle=await allowCreate(request,env);if(!throttle.ok)return respond(429,{error:'too_many_rooms'});
  const roomId=randomId('grm'),playerId=randomId('gpl'),playerToken=randomSessionToken(),tokenHash=await sha256Base64Url(playerToken),createdAt=nowIso(),expiresAt=futureIso(ROOM_TTL_MINUTES),state=createInitialXoRoomState(playerId);
  let code=null;
  for(let attempt=0;attempt<12;attempt++){
    const candidate=generateRoomCode();
    try{
      await env.DB.batch([
        env.DB.prepare('INSERT INTO game_rooms(id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(roomId,candidate,gameId,'waiting',JSON.stringify(state),0,throttle.key,expiresAt,createdAt,createdAt),
        env.DB.prepare('INSERT INTO game_room_players(room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?)').bind(roomId,playerId,learnerId,DISPLAY_NAMES[learnerId],tokenHash,0,createdAt,createdAt)
      ]);
      code=candidate;break;
    }catch(error){if(!String(error?.message||error).toLowerCase().includes('unique'))throw error;}
  }
  if(!code)return respond(503,{error:'room_code_unavailable'});
  const row=await roomByCode(env,code);return respond(201,{playerToken,room:await roomPayload(env,row,playerId)});
}

async function joinRoom(request,env,respond,readJson){
  const body=await readJson(request),code=normalizeCode(body?.code),learnerId=String(body?.learnerId||'');
  if(code.length!==6||!validLearner(learnerId))return respond(400,{error:'invalid_join_request'});
  const row=await roomByCode(env,code);if(!row||Date.parse(row.expires_at)<=Date.now())return respond(404,{error:'room_not_found'});
  if(row.status!=='waiting')return respond(409,{error:'room_not_waiting',room:await roomPayload(env,row)});
  const existing=await playersForRoom(env,row.id);if(existing.some(item=>item.learner_id===learnerId))return respond(409,{error:'learner_already_in_room'});
  let state;try{state=JSON.parse(row.state_json);}catch{return respond(500,{error:'invalid_room_state'});}
  const playerId=randomId('gpl'),playerToken=randomSessionToken(),tokenHash=await sha256Base64Url(playerToken),joinedAt=nowIso(),next=addXoRoomGuest(state,playerId);if(!next.ok)return respond(409,{error:next.reason});
  const insert=await env.DB.prepare('INSERT OR IGNORE INTO game_room_players(room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?)').bind(row.id,playerId,learnerId,DISPLAY_NAMES[learnerId],tokenHash,1,joinedAt,joinedAt).run();
  if(Number(insert?.meta?.changes||0)!==1)return respond(409,{error:'room_full'});
  const update=await env.DB.prepare('UPDATE game_rooms SET status=?,state_json=?,version=version+1,updated_at=?,expires_at=? WHERE id=? AND version=?').bind('playing',JSON.stringify(next.state),joinedAt,futureIso(ROOM_TTL_MINUTES),row.id,row.version).run();
  if(Number(update?.meta?.changes||0)!==1)return respond(409,{error:'room_changed'});
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
  const body=await readJson(request),expectedVersion=Number(body?.expectedVersion),type=String(body?.type||''),cell=body?.cell;
  if(!Number.isInteger(expectedVersion)||expectedVersion!==Number(row.version))return respond(409,{error:'version_conflict',room:await roomPayload(env,row,player.player_id)});
  let state;try{state=JSON.parse(row.state_json);}catch{return respond(500,{error:'invalid_room_state'});}
  const result=applyXoRoomAction(state,{playerId:player.player_id,type,cell});if(!result.ok)return respond(409,{error:result.reason,room:await roomPayload(env,row,player.player_id)});
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
