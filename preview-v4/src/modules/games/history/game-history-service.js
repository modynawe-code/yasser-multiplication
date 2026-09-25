import { getGameRoomApiBase } from '../online/game-room-client.js';

const QUEUE_KEY='family-game-history-pending-v1';
const MAX_QUEUE=100;

function readQueue(){
  try{const value=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return[];}
}
function writeQueue(items){
  try{localStorage.setItem(QUEUE_KEY,JSON.stringify(items.slice(-MAX_QUEUE)));return true;}catch{return false;}
}
function uid(prefix='match'){
  try{if(globalThis.crypto?.randomUUID)return `${prefix}-${crypto.randomUUID()}`;}catch{}
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}
function cleanPlayer(player,index){
  return{
    learnerId:String(player?.learnerId||player?.id||'').trim().toLowerCase(),
    displayName:String(player?.displayName||player?.name||player?.learnerId||player?.id||'').trim(),
    seat:Number.isInteger(player?.seat)?player.seat:index,
    score:player?.score===null||player?.score===undefined?null:Number(player.score),
    outcome:['win','draw','loss','played'].includes(player?.outcome)?player.outcome:'played',
    details:player?.details&&typeof player.details==='object'?player.details:{}
  };
}
function makePayload(result={}){
  const endedAt=result.endedAt||new Date().toISOString();
  return{
    matchId:String(result.matchId||uid(result.gameId||'game')),
    gameId:String(result.gameId||'').trim().toLowerCase(),
    gameVersion:Number(result.gameVersion||1),
    playMode:'local',
    startedAt:result.startedAt||null,
    endedAt,
    winnerIds:Array.isArray(result.winnerIds)?[...new Set(result.winnerIds.map(String))]:[],
    players:(result.players||[]).map(cleanPlayer),
    details:result.details&&typeof result.details==='object'?result.details:{}
  };
}
async function post(payload,fetchImpl=globalThis.fetch){
  const base=getGameRoomApiBase();
  if(!base||typeof fetchImpl!=='function')throw new Error('game_history_unavailable');
  const response=await fetchImpl(`${base}/v1/games/history`,{
    method:'POST',
    headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify(payload),
    cache:'no-store'
  });
  let body=null;try{body=await response.json();}catch{}
  if(!response.ok){const error=new Error(body?.error||`game_history_http_${response.status}`);error.status=response.status;error.body=body;throw error;}
  return body;
}

export function createGameHistoryService({fetchImpl=globalThis.fetch}={}){
  let flushing=false;
  async function flushPending(){
    if(flushing)return{ok:true,flushing:true};
    flushing=true;
    try{
      const queue=readQueue(),remaining=[];
      for(const payload of queue){
        try{await post(payload,fetchImpl);}catch{remaining.push(payload);}
      }
      writeQueue(remaining);
      return{ok:remaining.length===0,pending:remaining.length};
    }finally{flushing=false;}
  }
  async function recordGameResult(result){
    const payload=makePayload(result);
    try{
      const saved=await post(payload,fetchImpl);
      void flushPending();
      return{ok:true,queued:false,payload,...saved};
    }catch(error){
      const queue=readQueue();
      if(!queue.some(item=>item.matchId===payload.matchId))queue.push(payload);
      writeQueue(queue);
      return{ok:false,queued:true,payload,error};
    }
  }
  async function getHistory({limit=30}={}){
    const base=getGameRoomApiBase(),response=await fetchImpl(`${base}/v1/games/history?limit=${Math.max(1,Math.min(100,Number(limit)||30))}`,{headers:{accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`game_history_http_${response.status}`);
    return response.json();
  }
  async function getStats({days=7}={}){
    const base=getGameRoomApiBase(),response=await fetchImpl(`${base}/v1/games/stats?days=${Math.max(1,Math.min(3650,Number(days)||7))}`,{headers:{accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`game_stats_http_${response.status}`);
    return response.json();
  }
  return Object.freeze({recordGameResult,flushPending,getHistory,getStats,pendingCount:()=>readQueue().length});
}

export const gameHistoryService=createGameHistoryService();

if(typeof globalThis.addEventListener==='function'){
  globalThis.addEventListener('online',()=>{void gameHistoryService.flushPending();});
  queueMicrotask(()=>{void gameHistoryService.flushPending();});
}
