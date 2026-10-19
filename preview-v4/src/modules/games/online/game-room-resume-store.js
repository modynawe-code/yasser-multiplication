import { normalizeLearnerId } from '../../../shared/learners/learner-id.js';

const SESSION_KEY='games_online_active_v2';
const LOCAL_PREFIX='games_online_resume_v2:';
const INDEX_KEY='games_online_resume_index_v2';
const LEGACY_SESSION_KEY='games_online_active_v1';
const LEGACY_PREFIX='games_online_resume_v1:';
const GAME_ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeParse(value){try{return JSON.parse(value);}catch{return null;}}
function gameId(value){const id=String(value||'').trim().toLowerCase();return GAME_ID_PATTERN.test(id)?id:null;}
function normalize(record){
  if(!record)return null;
  const normalizedGameId=gameId(record.gameId),code=String(record.code||'').replace(/\D/g,'').slice(0,6),token=String(record.token||''),selfLearnerId=normalizeLearnerId(record.selfLearnerId),selfPlayerId=String(record.selfPlayerId||'').trim(),expiresAt=String(record.expiresAt||'');
  if(!normalizedGameId||code.length!==6||token.length<16||!selfLearnerId||!selfPlayerId)return null;
  if(expiresAt&&Date.parse(expiresAt)<=Date.now())return null;
  return Object.freeze({gameId:normalizedGameId,code,token,selfPlayerId,selfLearnerId,expiresAt});
}
function get(storage,key){try{return storage?.getItem(key)||'';}catch{return'';}}
function set(storage,key,value){try{storage?.setItem(key,value);return true;}catch{return false;}}
function remove(storage,key){try{storage?.removeItem(key);}catch{}}
function storageKeys(storage,prefix){
  const keys=[];try{for(let i=0;i<Number(storage?.length||0);i++){const key=storage.key?.(i);if(typeof key==='string'&&key.startsWith(prefix))keys.push(key);}}catch{}
  return keys;
}
function index(localStorage){const parsed=safeParse(get(localStorage,INDEX_KEY));return Array.isArray(parsed)?parsed.filter(key=>typeof key==='string'&&key.startsWith(LOCAL_PREFIX)):[];}
function saveIndex(localStorage,keys){set(localStorage,INDEX_KEY,JSON.stringify([...new Set(keys)].slice(0,48)));}
function localKey(record){return `${LOCAL_PREFIX}${record.gameId}:${record.selfLearnerId}`;}
function matches(record,{gameId:filterGameId=null,learnerId=null}={}){
  if(!record)return false;
  const normalizedGame=filterGameId?gameId(filterGameId):null,normalizedLearner=learnerId?normalizeLearnerId(learnerId):null;
  if(filterGameId&&!normalizedGame)return false;
  if(learnerId&&!normalizedLearner)return false;
  return(!normalizedGame||record.gameId===normalizedGame)&&(!normalizedLearner||record.selfLearnerId===normalizedLearner);
}

export function createGameRoomResumeStore({sessionStorage=globalThis.sessionStorage,localStorage=globalThis.localStorage,gameId:defaultGameId=null}={}){
  const scopedGameId=defaultGameId?gameId(defaultGameId):null;
  if(defaultGameId&&!scopedGameId)throw new TypeError('invalid game id');

  function save(record){
    const normalized=normalize(record);if(!normalized||scopedGameId&&normalized.gameId!==scopedGameId)return false;
    const json=JSON.stringify(normalized),key=localKey(normalized);
    const keys=[key,...index(localStorage),...storageKeys(localStorage,LOCAL_PREFIX).filter(item=>item!==key)];
    set(sessionStorage,SESSION_KEY,json);set(localStorage,key,json);saveIndex(localStorage,keys);return true;
  }

  function candidates(){
    const records=[];
    const push=value=>{const record=normalize(safeParse(value));if(record&&!records.some(item=>item.gameId===record.gameId&&item.code===record.code&&item.selfLearnerId===record.selfLearnerId))records.push(record);};
    push(get(sessionStorage,SESSION_KEY));
    push(get(sessionStorage,LEGACY_SESSION_KEY));
    const keys=[...index(localStorage),...storageKeys(localStorage,LOCAL_PREFIX),...storageKeys(localStorage,LEGACY_PREFIX)];
    keys.forEach(key=>push(get(localStorage,key)));
    return records;
  }

  function load(filters={}){
    const scope={gameId:filters.gameId||scopedGameId,learnerId:filters.learnerId||null};
    return candidates().find(record=>matches(record,scope))||null;
  }

  function clear(record={}){
    const targetGameId=gameId(record.gameId||scopedGameId),targetLearnerId=normalizeLearnerId(record.selfLearnerId);
    const active=normalize(safeParse(get(sessionStorage,SESSION_KEY)));
    if(!targetGameId&&!targetLearnerId||matches(active,{gameId:targetGameId,learnerId:targetLearnerId}))remove(sessionStorage,SESSION_KEY);
    const legacyActive=normalize(safeParse(get(sessionStorage,LEGACY_SESSION_KEY)));
    if(!targetGameId&&!targetLearnerId||matches(legacyActive,{gameId:targetGameId,learnerId:targetLearnerId}))remove(sessionStorage,LEGACY_SESSION_KEY);

    const keys=[...new Set([...index(localStorage),...storageKeys(localStorage,LOCAL_PREFIX),...storageKeys(localStorage,LEGACY_PREFIX)])];
    const kept=[];
    for(const key of keys){
      const saved=normalize(safeParse(get(localStorage,key)));
      if(saved&&matches(saved,{gameId:targetGameId,learnerId:targetLearnerId}))remove(localStorage,key);
      else if(key.startsWith(LOCAL_PREFIX))kept.push(key);
    }
    saveIndex(localStorage,kept);
  }

  return Object.freeze({save,load,clear,has(filters={}){return Boolean(load(filters));}});
}
