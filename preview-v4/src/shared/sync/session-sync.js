function finite(value){const number=Number(value);return Number.isFinite(number)?number:0;}
function timestamp(session){return String(session?.endedAt||session?.at||session?.startedAt||'');}
function canonicalSession(learnerId,session={}){
  return JSON.stringify([
    String(learnerId||''),
    String(session.startedAt||''),
    String(session.endedAt||session.at||''),
    String(session.skillId||''),
    String(session.mode||''),
    finite(session.total??session.completed),
    finite(session.correct),
    finite(session.wrong),
    finite(session.firstTryCorrect),
    finite(session.correctedAfterError),
    finite(session.assistedCorrect),
    finite(session.unresolved),
    finite(session.masteryScore??session.pct),
    Boolean(session.incomplete)
  ]);
}
function hashText(value){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return (hash>>>0).toString(16).padStart(8,'0');
}

export function createSessionSyncId(learnerId,session={}){
  const explicit=String(session?.sessionId||'').trim();
  if(explicit)return explicit.slice(0,180);
  return `${String(learnerId||'learner')}-session-${hashText(canonicalSession(learnerId,session))}`.slice(0,180);
}

export function restoreSessionRecord(payload={}){
  if(payload?.session&&typeof payload.session==='object'&&!Array.isArray(payload.session))return structuredClone(payload.session);
  return {
    sessionId:String(payload.sessionId||''),
    skillId:payload.skillId??null,
    mode:payload.mode??null,
    startedAt:payload.startedAt??null,
    endedAt:payload.endedAt??null,
    at:payload.endedAt||payload.startedAt||null,
    correct:finite(payload.correct),
    wrong:finite(payload.wrong),
    total:finite(payload.total),
    incomplete:Boolean(payload.incomplete),
    cloudRestored:true
  };
}

export function appendCloudSession(state,payload,{learnerId,limit=100}={}){
  if(!state||typeof state!=='object'||!learnerId)return false;
  if(payload?.learnerId&&payload.learnerId!==learnerId)return false;
  if(!Array.isArray(state.sessions))state.sessions=[];
  const incoming=restoreSessionRecord(payload),incomingId=createSessionSyncId(learnerId,incoming);
  if(state.sessions.some(item=>createSessionSyncId(learnerId,item)===incomingId))return false;
  state.sessions.push(incoming);
  state.sessions.sort((a,b)=>Date.parse(timestamp(b)||0)-Date.parse(timestamp(a)||0));
  state.sessions=state.sessions.slice(0,Math.max(1,Number(limit)||100));
  return true;
}
