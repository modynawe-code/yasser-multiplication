import { randomId,randomSessionToken,sha256Base64Url } from './security.mjs';

const GAME_ID=/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const LEARNER_ID=GAME_ID;
const OUTCOMES=new Set(['win','draw','loss','played']);
const MODES=new Set(['local','online']);

function cleanText(value,max=80){
  return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function safeJson(value,max=32000){
  try{
    const text=JSON.stringify(value&&typeof value==='object'?value:{});
    return text.length<=max?text:JSON.stringify({truncated:true});
  }catch{return'{}';}
}
function isoOrNull(value){
  if(!value)return null;
  const ms=Date.parse(value);
  return Number.isFinite(ms)?new Date(ms).toISOString():null;
}
function uniq(values){return[...new Set((values||[]).map(x=>String(x||'')).filter(Boolean))];}
function terminalOutcome(gameId,state){
  if(!state||typeof state!=='object')return null;
  if(gameId==='xo'){
    if(state.status==='won'&&state.winner)return{winnerIds:[state.winner],scores:{},details:{round:state.round||1,moveCount:state.moveCount||0}};
    if(state.status==='draw')return{winnerIds:[],draw:true,scores:{},details:{round:state.round||1,moveCount:state.moveCount||0}};
    return null;
  }
  if(gameId==='rock-paper-scissors'){
    if(state.status!=='finished'||!state.matchWinner)return null;
    return{winnerIds:[state.matchWinner],scores:state.scores||{},details:{round:state.round||1,targetScore:state.targetScore||3}};
  }
  if(gameId==='domino'){
    if(state.status==='finished'&&state.winner)return{winnerIds:[state.winner],scores:state.roundTotals||{},details:{round:state.round||1,roundTotals:state.roundTotals||{},blocked:Boolean(state.blocked)}};
    if(state.status==='draw')return{winnerIds:[],draw:true,scores:state.roundTotals||{},details:{round:state.round||1,roundTotals:state.roundTotals||{},blocked:Boolean(state.blocked)}};
    return null;
  }
  if(gameId==='family-word-categories'){
    if(state.status!=='finished')return null;
    return{winnerIds:uniq(state.winnerIds),scores:state.scores||{},details:{roundsTotal:state.roundsTotal||state.round||0,usedLetters:state.usedLetters||[]}};
  }
  if(state.status==='finished'||state.status==='won'||state.status==='draw'){
    return{winnerIds:uniq(state.winnerIds||[state.winner].filter(Boolean)),draw:state.status==='draw',scores:state.scores||{},details:{}};
  }
  return null;
}

export async function historyFamilyForDeviceToken(request,env){
  const token=String(request.headers.get('x-family-game-token')||'').trim();
  if(!token)return null;
  const hash=await sha256Base64Url(token);
  const row=await env.DB.prepare('SELECT id,parent_id FROM game_history_devices WHERE token_hash=? AND revoked_at IS NULL').bind(hash).first();
  if(!row)return null;
  env.DB.prepare('UPDATE game_history_devices SET last_seen_at=? WHERE id=?').bind(new Date().toISOString(),row.id).run().catch(()=>null);
  return row.parent_id||null;
}

async function historyFamily(request,env,auth=null){
  if(auth?.parent_id)return auth.parent_id;
  return historyFamilyForDeviceToken(request,env);
}

export async function createGameHistoryDevice(request,env,respond,auth,readJson){
  if(!auth?.parent_id)return respond(401,{error:'family_auth_required'});
  const body=await readJson(request),label=cleanText(body?.label||'family-device',80)||'family-device';
  const token=randomSessionToken(),hash=await sha256Base64Url(token),createdAt=new Date().toISOString(),id=randomId('ghd');
  await env.DB.prepare('INSERT INTO game_history_devices(id,parent_id,token_hash,label,created_at,last_seen_at,revoked_at) VALUES(?,?,?,?,?,?,NULL)')
    .bind(id,auth.parent_id,hash,label,createdAt,createdAt).run();
  return respond(201,{deviceToken:token,deviceId:id,label,createdAt});
}

export function normalizeGameMatch(input,{recordedAt=new Date().toISOString(),familyId=null}={}){
  const gameId=cleanText(input?.gameId,64).toLowerCase();
  const matchId=cleanText(input?.matchId,120);
  const playMode=cleanText(input?.playMode||input?.mode,16).toLowerCase();
  const gameVersion=Math.max(1,Math.min(100000,Number(input?.gameVersion||1)||1));
  if(!familyId||!matchId||!GAME_ID.test(gameId)||!MODES.has(playMode))return{ok:false,error:'invalid_match'};
  const rawPlayers=Array.isArray(input?.players)?input.players:[];
  if(rawPlayers.length<1||rawPlayers.length>16)return{ok:false,error:'invalid_players'};
  const players=[],seen=new Set();
  for(let index=0;index<rawPlayers.length;index++){
    const raw=rawPlayers[index]||{},learnerId=cleanText(raw.learnerId||raw.id,64).toLowerCase();
    if(!LEARNER_ID.test(learnerId)||seen.has(learnerId))return{ok:false,error:'invalid_players'};
    seen.add(learnerId);
    const displayName=cleanText(raw.displayName||raw.name||learnerId,80)||learnerId;
    const score=raw.score===null||raw.score===undefined?null:Number(raw.score);
    if(score!==null&&!Number.isFinite(score))return{ok:false,error:'invalid_score'};
    const outcome=OUTCOMES.has(raw.outcome)?raw.outcome:'played';
    players.push({learnerId,displayName,seat:Number.isInteger(raw.seat)?raw.seat:index,score,outcome,detailsJson:safeJson(raw.details,8000)});
  }
  const playerIds=new Set(players.map(p=>p.learnerId));
  const requestedWinners=Array.isArray(input?.winnerIds)?input.winnerIds:[];
  const winnerIds=uniq(requestedWinners).filter(id=>playerIds.has(id));
  if(requestedWinners.length!==winnerIds.length)return{ok:false,error:'invalid_winners'};
  const startedAt=isoOrNull(input?.startedAt),endedAt=isoOrNull(input?.endedAt)||recordedAt;
  return{ok:true,value:{
    matchId,familyId,gameId,gameVersion,playMode,sourceRoomId:cleanText(input?.sourceRoomId,120)||null,
    sourceRoomVersion:Number.isInteger(input?.sourceRoomVersion)?input.sourceRoomVersion:null,
    startedAt,endedAt,recordedAt,winnerIds,detailsJson:safeJson(input?.details),players
  }};
}

function applyOutcomes(players,winnerIds,{draw=false}={}){
  const winners=new Set(winnerIds||[]);
  return players.map(player=>({...player,outcome:draw?'draw':winners.size?(winners.has(player.learnerId)?'win':'loss'):'played'}));
}

export function buildOnlineRoomMatch({roomRow,players,state,version,recordedAt=new Date().toISOString()}={}){
  const familyId=roomRow?.history_family_id||null;
  if(!familyId)return null;
  const gameId=String(roomRow?.game_id||''),terminal=terminalOutcome(gameId,state);
  if(!terminal)return null;
  const byPlayerId=new Map((players||[]).filter(p=>(p.participation_role||'player')==='player').map(p=>[p.player_id,p]));
  const winnerLearners=uniq(terminal.winnerIds).map(pid=>byPlayerId.get(pid)?.learner_id).filter(Boolean);
  const matchPlayers=[...byPlayerId.entries()].map(([playerId,p],index)=>({
    learnerId:p.learner_id,displayName:p.display_name,seat:p.seat??index,
    score:terminal.scores?.[playerId]??null,outcome:'played',details:{playerId}
  }));
  return normalizeGameMatch({
    matchId:`online-${roomRow.id}-v${version}`,
    gameId,gameVersion:1,playMode:'online',sourceRoomId:roomRow.id,sourceRoomVersion:version,
    startedAt:state?.startedAt||roomRow.created_at,endedAt:recordedAt,winnerIds:winnerLearners,
    details:{roomCode:roomRow.code,...terminal.details},
    players:applyOutcomes(matchPlayers,winnerLearners,{draw:Boolean(terminal.draw)})
  },{recordedAt,familyId});
}

export async function persistGameMatch(env,match){
  const m=match;
  if(!m?.matchId||!m?.familyId)return{ok:false,error:'invalid_match'};
  const existing=await env.DB.prepare('SELECT match_id,recorded_at FROM game_matches WHERE match_id=? AND family_id=?').bind(m.matchId,m.familyId).first();
  if(existing)return{ok:true,duplicate:true,matchId:existing.match_id,recordedAt:existing.recorded_at};
  const statements=[
    env.DB.prepare('INSERT INTO game_matches(match_id,family_id,game_id,game_version,play_mode,source_room_id,source_room_version,started_at,ended_at,recorded_at,winner_ids_json,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(m.matchId,m.familyId,m.gameId,m.gameVersion,m.playMode,m.sourceRoomId,m.sourceRoomVersion,m.startedAt,m.endedAt,m.recordedAt,JSON.stringify(m.winnerIds),m.detailsJson),
    ...m.players.map(p=>env.DB.prepare('INSERT INTO game_match_players(match_id,learner_id,display_name,seat,score,outcome,details_json) VALUES(?,?,?,?,?,?,?)')
      .bind(m.matchId,p.learnerId,p.displayName,p.seat,p.score,p.outcome,p.detailsJson))
  ];
  await env.DB.batch(statements);
  return{ok:true,duplicate:false,matchId:m.matchId,recordedAt:m.recordedAt};
}

export async function recordOnlineRoomMatch(env,args){
  const match=buildOnlineRoomMatch(args);
  if(!match?.ok)return match?match:null;
  return persistGameMatch(env,match.value);
}

export async function createLocalGameHistory(request,env,respond,readJson,auth=null){
  const familyId=await historyFamily(request,env,auth);
  if(!familyId)return respond(401,{error:'history_device_required'});
  const recordedAt=new Date().toISOString(),parsed=normalizeGameMatch(await readJson(request),{recordedAt,familyId});
  if(!parsed.ok)return respond(400,{error:parsed.error});
  if(parsed.value.playMode!=='local')return respond(400,{error:'local_mode_required'});
  const result=await persistGameMatch(env,parsed.value);
  return respond(result.duplicate?200:201,result);
}

export async function listGameHistory(request,env,respond,auth=null){
  const familyId=await historyFamily(request,env,auth);
  if(!familyId)return respond(401,{error:'history_device_required'});
  const url=new URL(request.url),limit=Math.max(1,Math.min(100,Number(url.searchParams.get('limit')||30)||30));
  const rows=await env.DB.prepare('SELECT match_id,game_id,game_version,play_mode,started_at,ended_at,recorded_at,winner_ids_json FROM game_matches WHERE family_id=? ORDER BY ended_at DESC LIMIT ?').bind(familyId,limit).all();
  const matches=[];
  for(const row of rows.results||[]){
    const playerRows=await env.DB.prepare('SELECT learner_id,display_name,seat,score,outcome FROM game_match_players WHERE match_id=? ORDER BY seat,learner_id').bind(row.match_id).all();
    let winnerIds=[];try{winnerIds=JSON.parse(row.winner_ids_json||'[]');}catch{}
    matches.push({matchId:row.match_id,gameId:row.game_id,gameVersion:Number(row.game_version||1),playMode:row.play_mode,startedAt:row.started_at,endedAt:row.ended_at,recordedAt:row.recorded_at,winnerIds,players:(playerRows.results||[]).map(p=>({learnerId:p.learner_id,displayName:p.display_name,seat:p.seat,score:p.score,outcome:p.outcome}))});
  }
  return respond(200,{matches});
}

export async function gameHistoryStats(request,env,respond,auth=null){
  const familyId=await historyFamily(request,env,auth);
  if(!familyId)return respond(401,{error:'history_device_required'});
  const url=new URL(request.url),days=Math.max(1,Math.min(3650,Number(url.searchParams.get('days')||7)||7)),since=new Date(Date.now()-days*86400000).toISOString();
  const rows=await env.DB.prepare(`SELECT p.learner_id,p.display_name,
    COUNT(*) AS matches,
    SUM(CASE WHEN p.outcome='win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN p.outcome='draw' THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN p.outcome='loss' THEN 1 ELSE 0 END) AS losses,
    SUM(CASE WHEN p.outcome='win' THEN 3 WHEN p.outcome='draw' THEN 1 ELSE 0 END) AS cup_points
    FROM game_match_players p JOIN game_matches m ON m.match_id=p.match_id
    WHERE m.family_id=? AND m.ended_at>=?
    GROUP BY p.learner_id,p.display_name
    ORDER BY cup_points DESC,wins DESC,matches DESC,p.display_name`).bind(familyId,since).all();
  return respond(200,{days,players:(rows.results||[]).map(r=>({learnerId:r.learner_id,displayName:r.display_name,matches:Number(r.matches||0),wins:Number(r.wins||0),draws:Number(r.draws||0),losses:Number(r.losses||0),cupPoints:Number(r.cup_points||0)}))});
}
