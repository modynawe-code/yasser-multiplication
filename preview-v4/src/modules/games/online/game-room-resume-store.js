const SESSION_KEY='games_online_active_v1';
const LOCAL_PREFIX='games_online_resume_v1:';
const LEARNERS=Object.freeze(['yasser','khaled']);

function safeParse(value){try{return JSON.parse(value);}catch{return null;}}
function normalize(record){
  if(!record||record.gameId!=='xo')return null;
  const code=String(record.code||'').replace(/\D/g,'').slice(0,6),token=String(record.token||''),selfLearnerId=String(record.selfLearnerId||''),selfPlayerId=String(record.selfPlayerId||''),expiresAt=String(record.expiresAt||'');
  if(code.length!==6||token.length<16||!LEARNERS.includes(selfLearnerId)||!selfPlayerId)return null;
  if(expiresAt&&Date.parse(expiresAt)<=Date.now())return null;
  return Object.freeze({gameId:'xo',code,token,selfPlayerId,selfLearnerId,expiresAt});
}
function get(storage,key){try{return storage?.getItem(key)||'';}catch{return'';}}
function set(storage,key,value){try{storage?.setItem(key,value);return true;}catch{return false;}}
function remove(storage,key){try{storage?.removeItem(key);}catch{}}

export function createGameRoomResumeStore({sessionStorage=globalThis.sessionStorage,localStorage=globalThis.localStorage}={}){
  function save(record){
    const normalized=normalize(record);if(!normalized)return false;
    const json=JSON.stringify(normalized);set(sessionStorage,SESSION_KEY,json);set(localStorage,`${LOCAL_PREFIX}${normalized.selfLearnerId}`,json);return true;
  }
  function load(){
    const session=normalize(safeParse(get(sessionStorage,SESSION_KEY)));if(session)return session;
    const candidates=LEARNERS.map(id=>normalize(safeParse(get(localStorage,`${LOCAL_PREFIX}${id}`)))).filter(Boolean);
    return candidates.length===1?candidates[0]:null;
  }
  function clear(record){
    const learnerId=record?.selfLearnerId||normalize(safeParse(get(sessionStorage,SESSION_KEY)))?.selfLearnerId;
    remove(sessionStorage,SESSION_KEY);if(LEARNERS.includes(learnerId))remove(localStorage,`${LOCAL_PREFIX}${learnerId}`);
  }
  return Object.freeze({save,load,clear,has(){return Boolean(load());}});
}
