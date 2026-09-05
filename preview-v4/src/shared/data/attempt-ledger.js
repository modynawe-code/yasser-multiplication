export const ATTEMPT_LEDGER_VERSION=1;

export function createAttemptId(prefix='att'){
  if(globalThis.crypto?.randomUUID)return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeAttemptLog(value){
  if(!Array.isArray(value))return[];
  const seen=new Set(),normalized=[];
  for(const item of value){
    if(!item||typeof item!=='object')continue;
    const attemptId=String(item.attemptId||'').trim();
    if(!attemptId||seen.has(attemptId))continue;
    seen.add(attemptId);
    normalized.push({...item,attemptId});
  }
  return normalized;
}

export function appendAttemptEvent(state,event){
  if(!state||!event?.attemptId)throw new Error('Attempt event requires state and attemptId');
  if(!Array.isArray(state.attemptLog))state.attemptLog=[];
  if(state.attemptLog.some(item=>item.attemptId===event.attemptId))return false;
  state.attemptLog.push(Object.freeze({...event}));
  return true;
}

export function createLedgerBaseline({attempts=0,correct=0,wrong=0,capturedAt=new Date().toISOString()}={}){
  return Object.freeze({attempts:Number(attempts||0),correct:Number(correct||0),wrong:Number(wrong||0),capturedAt});
}

export function normalizeLedgerBaseline(value,fallback={}){
  if(value&&typeof value==='object')return createLedgerBaseline({
    attempts:value.attempts,
    correct:value.correct,
    wrong:value.wrong,
    capturedAt:value.capturedAt||new Date().toISOString()
  });
  return createLedgerBaseline(fallback);
}

export function summarizeAttemptLedger({baseline,attemptLog}={}){
  const base=normalizeLedgerBaseline(baseline,{capturedAt:'legacy'});
  const log=normalizeAttemptLog(attemptLog);
  let correct=base.correct,wrong=base.wrong;
  for(const event of log){event.isCorrect?correct++:wrong++;}
  return{attempts:base.attempts+log.length,correct,wrong,events:log.length};
}
