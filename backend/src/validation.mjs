const LEARNERS=new Set(['yasser','khaled']);
function isIsoDate(value){return typeof value==='string'&&!Number.isNaN(Date.parse(value));}
function jsonSafe(value,max=2000){try{const text=JSON.stringify(value);return text.length<=max?text:null;}catch{return null;}}

export function validateAttemptPayload(input){
  if(!input||typeof input!=='object')return{ok:false,error:'invalid_attempt'};
  const attemptId=String(input.attemptId||'').trim();
  const learnerId=String(input.learnerId||'').trim();
  const skillId=String(input.skillId||'').trim();
  const questionId=input.questionId==null?null:String(input.questionId).slice(0,180);
  const questionType=input.questionType==null?null:String(input.questionType).slice(0,80);
  const createdAt=String(input.createdAt||input.at||'');
  if(!attemptId||attemptId.length>180)return{ok:false,error:'invalid_attempt_id'};
  if(!LEARNERS.has(learnerId))return{ok:false,error:'invalid_learner'};
  if(!skillId||skillId.length>120)return{ok:false,error:'invalid_skill'};
  if(!isIsoDate(createdAt))return{ok:false,error:'invalid_created_at'};
  const answerJson=jsonSafe(input.answer),correctAnswerJson=jsonSafe(input.correctAnswer);
  if(answerJson===null||correctAnswerJson===null)return{ok:false,error:'answer_too_large'};
  const responseMs=input.responseMs==null?null:Number(input.responseMs);
  if(responseMs!==null&&(!Number.isFinite(responseMs)||responseMs<0||responseMs>3600000))return{ok:false,error:'invalid_response_ms'};
  return{ok:true,value:{attemptId,learnerId,skillId,questionId,questionType,answerJson,correctAnswerJson,isCorrect:Boolean(input.isCorrect),responseMs,createdAt}};
}

export function validateAttemptBatch(body,{maxBatch=250}={}){
  if(!body||!Array.isArray(body.attempts))return{ok:false,error:'attempts_array_required'};
  if(body.attempts.length>maxBatch)return{ok:false,error:'batch_too_large'};
  const attempts=[];
  for(const raw of body.attempts){const result=validateAttemptPayload(raw);if(!result.ok)return result;attempts.push(result.value);}
  return{ok:true,value:attempts};
}

export function validateSessionPayload(input){
  if(!input||typeof input!=='object')return{ok:false,error:'invalid_session'};
  const sessionId=String(input.sessionId||'').trim(),learnerId=String(input.learnerId||'').trim();
  if(!sessionId||sessionId.length>180||!LEARNERS.has(learnerId))return{ok:false,error:'invalid_session_identity'};
  return{ok:true,value:{
    sessionId,learnerId,skillId:input.skillId==null?null:String(input.skillId).slice(0,120),mode:input.mode==null?null:String(input.mode).slice(0,40),
    startedAt:isIsoDate(input.startedAt)?input.startedAt:null,endedAt:isIsoDate(input.endedAt)?input.endedAt:null,
    correct:Math.max(0,Number(input.correct||0)),wrong:Math.max(0,Number(input.wrong||0)),total:Math.max(0,Number(input.total||input.completed||0)),incomplete:Boolean(input.incomplete)
  }};
}
