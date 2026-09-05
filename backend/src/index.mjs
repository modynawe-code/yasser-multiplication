import { hashPassword, normalizeEmail, randomId, randomSessionToken, SECURITY_DEFAULTS, sha256Base64Url, validatePassword, verifyPassword } from './security.mjs';
import { validateAttemptBatch, validateSessionPayload } from './validation.mjs';

const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const nowIso=()=>new Date().toISOString();
const futureIso=days=>new Date(Date.now()+days*86400000).toISOString();

function allowedOrigin(request,env){
  const origin=request.headers.get('origin');if(!origin)return null;
  const allowed=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  return allowed.includes(origin)?origin:null;
}
function corsHeaders(request,env){const origin=allowedOrigin(request,env);return origin?{'access-control-allow-origin':origin,'access-control-allow-credentials':'true','vary':'Origin'}:{};}
function response(request,env,status,body,extra={}){return new Response(body==null?null:JSON.stringify(body),{status,headers:{...JSON_HEADERS,...corsHeaders(request,env),...extra}});}
async function readJson(request){try{return await request.json();}catch{return null;}}
function bearer(request){const value=request.headers.get('authorization')||'';return value.startsWith('Bearer ')?value.slice(7).trim():'';}

async function authenticate(request,env){
  const token=bearer(request);if(!token)return null;
  const tokenHash=await sha256Base64Url(token),now=nowIso();
  const row=await env.DB.prepare('SELECT s.id AS session_id,s.parent_id,p.email FROM auth_sessions s JOIN parents p ON p.id=s.parent_id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,now).first();
  if(!row)return null;
  env.DB.prepare('UPDATE auth_sessions SET last_seen_at=? WHERE id=?').bind(now,row.session_id).run().catch(()=>null);
  return row;
}
async function learnersForParent(env,parentId){
  const rows=await env.DB.prepare('SELECT id,slug,display_name FROM learners WHERE parent_id=? ORDER BY slug').bind(parentId).all();
  return rows.results||[];
}
async function learnerMap(env,parentId){return Object.fromEntries((await learnersForParent(env,parentId)).map(row=>[row.slug,row.id]));}

async function throttleStatus(env,key){
  const row=await env.DB.prepare('SELECT failures,window_started_at,blocked_until FROM auth_throttle WHERE throttle_key=?').bind(key).first();
  if(!row)return{blocked:false};
  return{blocked:Boolean(row.blocked_until&&Date.parse(row.blocked_until)>Date.now()),row};
}
async function recordLoginFailure(env,key){
  const current=await throttleStatus(env,key),now=Date.now();
  let failures=1,windowStarted=new Date(now).toISOString();
  if(current.row&&now-Date.parse(current.row.window_started_at)<SECURITY_DEFAULTS.loginWindowMinutes*60000){failures=Number(current.row.failures||0)+1;windowStarted=current.row.window_started_at;}
  const blockedUntil=failures>=SECURITY_DEFAULTS.maxLoginFailures?new Date(now+SECURITY_DEFAULTS.loginWindowMinutes*60000).toISOString():null;
  await env.DB.prepare('INSERT INTO auth_throttle(throttle_key,failures,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(throttle_key) DO UPDATE SET failures=excluded.failures,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until').bind(key,failures,windowStarted,blockedUntil).run();
}
async function clearThrottle(env,key){await env.DB.prepare('DELETE FROM auth_throttle WHERE throttle_key=?').bind(key).run();}
async function throttleKey(request,email){return sha256Base64Url(`${normalizeEmail(email)}|${request.headers.get('CF-Connecting-IP')||'unknown'}`);}

async function register(request,env){
  const body=await readJson(request),email=normalizeEmail(body?.email),password=body?.password;
  if(!/^\S+@\S+\.\S+$/.test(email)||!validatePassword(password))return response(request,env,400,{error:'invalid_credentials_format'});
  const existing=await env.DB.prepare('SELECT id FROM parents WHERE email=?').bind(email).first();
  if(existing)return response(request,env,409,{error:'account_exists'});
  const parentId=randomId('par'),createdAt=nowIso(),passwordRecord=await hashPassword(password);
  const yasserId=randomId('lrn'),khaledId=randomId('lrn');
  await env.DB.batch([
    env.DB.prepare('INSERT INTO parents(id,email,password_salt,password_hash,password_iterations,created_at) VALUES(?,?,?,?,?,?)').bind(parentId,email,passwordRecord.salt,passwordRecord.hash,passwordRecord.iterations,createdAt),
    env.DB.prepare('INSERT INTO learners(id,parent_id,slug,display_name,created_at) VALUES(?,?,?,?,?)').bind(yasserId,parentId,'yasser','ياسر',createdAt),
    env.DB.prepare('INSERT INTO learners(id,parent_id,slug,display_name,created_at) VALUES(?,?,?,?,?)').bind(khaledId,parentId,'khaled','خالد',createdAt)
  ]);
  return issueSession(request,env,parentId,email,201);
}
async function issueSession(request,env,parentId,email,status=200){
  const token=randomSessionToken(),tokenHash=await sha256Base64Url(token),id=randomId('ses'),createdAt=nowIso(),ttl=Math.max(1,Math.min(90,Number(env.SESSION_TTL_DAYS||SECURITY_DEFAULTS.sessionTtlDays))),expiresAt=futureIso(ttl);
  await env.DB.prepare('INSERT INTO auth_sessions(id,parent_id,token_hash,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?)').bind(id,parentId,tokenHash,expiresAt,createdAt,createdAt).run();
  const learners=await learnersForParent(env,parentId);
  return response(request,env,status,{token,expiresAt,parent:{email},learners:learners.map(({slug,display_name})=>({slug,name:display_name}))});
}
async function login(request,env){
  const body=await readJson(request),email=normalizeEmail(body?.email),password=String(body?.password||''),key=await throttleKey(request,email);
  if((await throttleStatus(env,key)).blocked)return response(request,env,429,{error:'too_many_attempts'});
  const row=await env.DB.prepare('SELECT id,email,password_salt,password_hash,password_iterations FROM parents WHERE email=?').bind(email).first();
  const ok=row&&await verifyPassword(password,{salt:row.password_salt,hash:row.password_hash,iterations:row.password_iterations});
  if(!ok){await recordLoginFailure(env,key);return response(request,env,401,{error:'invalid_credentials'});}
  await clearThrottle(env,key);return issueSession(request,env,row.id,row.email);
}
async function logout(request,env,auth){
  const tokenHash=await sha256Base64Url(bearer(request));
  await env.DB.prepare('DELETE FROM auth_sessions WHERE parent_id=? AND token_hash=?').bind(auth.parent_id,tokenHash).run();
  return response(request,env,200,{ok:true});
}

async function syncBaseline(request,env,auth){
  const body=await readJson(request),learnerId=String(body?.learnerId||''),state=body?.state;
  if(!['yasser','khaled'].includes(learnerId)||!state||typeof state!=='object')return response(request,env,400,{error:'invalid_baseline'});
  let stateJson;try{stateJson=JSON.stringify(state);}catch{return response(request,env,400,{error:'invalid_baseline'});}
  if(stateJson.length>2000000)return response(request,env,413,{error:'baseline_too_large'});
  const learners=await learnerMap(env,auth.parent_id),ownedId=learners[learnerId];
  if(!ownedId)return response(request,env,403,{error:'learner_not_owned'});
  await env.DB.prepare('INSERT OR IGNORE INTO learner_baselines(learner_id,state_json,created_at) VALUES(?,?,?)').bind(ownedId,stateJson,nowIso()).run();
  return response(request,env,200,{ok:true});
}
async function syncAttempts(request,env,auth){
  const parsed=validateAttemptBatch(await readJson(request));if(!parsed.ok)return response(request,env,400,{error:parsed.error});
  const learners=await learnerMap(env,auth.parent_id),receivedAt=nowIso(),statements=[];
  for(const item of parsed.value){
    const learnerId=learners[item.learnerId];if(!learnerId)return response(request,env,403,{error:'learner_not_owned'});
    statements.push(env.DB.prepare('INSERT OR IGNORE INTO attempts(attempt_id,learner_id,skill_id,table_number,multiplier,question_id,question_type,answer_json,correct_answer_json,is_correct,response_ms,client_created_at,received_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(item.attemptId,learnerId,item.skillId,item.table,item.multiplier,item.questionId,item.questionType,item.answerJson,item.correctAnswerJson,item.isCorrect?1:0,item.responseMs,item.createdAt,receivedAt));
  }
  if(statements.length)await env.DB.batch(statements);
  return response(request,env,200,{ok:true,received:parsed.value.length});
}
async function syncSession(request,env,auth){
  const parsed=validateSessionPayload(await readJson(request));if(!parsed.ok)return response(request,env,400,{error:parsed.error});
  const learners=await learnerMap(env,auth.parent_id),item=parsed.value,learnerId=learners[item.learnerId];if(!learnerId)return response(request,env,403,{error:'learner_not_owned'});
  await env.DB.prepare('INSERT OR IGNORE INTO learning_sessions(session_id,learner_id,skill_id,mode,started_at,ended_at,correct,wrong,total,incomplete,received_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(item.sessionId,learnerId,item.skillId,item.mode,item.startedAt,item.endedAt,item.correct,item.wrong,item.total,item.incomplete?1:0,nowIso()).run();
  return response(request,env,200,{ok:true});
}
async function snapshot(request,env,auth){
  const baselines=await env.DB.prepare(`SELECT l.slug AS learnerId,b.state_json AS stateJson FROM learner_baselines b JOIN learners l ON l.id=b.learner_id WHERE l.parent_id=?`).bind(auth.parent_id).all();
  const attempts=await env.DB.prepare(`SELECT a.attempt_id AS attemptId,l.slug AS learnerId,a.skill_id AS skillId,a.table_number AS "table",a.multiplier,a.question_id AS questionId,a.question_type AS questionType,a.answer_json AS answerJson,a.correct_answer_json AS correctAnswerJson,a.is_correct AS isCorrect,a.response_ms AS responseMs,a.client_created_at AS createdAt FROM attempts a JOIN learners l ON l.id=a.learner_id WHERE l.parent_id=? ORDER BY a.client_created_at ASC LIMIT 10000`).bind(auth.parent_id).all();
  const sessions=await env.DB.prepare(`SELECT s.session_id AS sessionId,l.slug AS learnerId,s.skill_id AS skillId,s.mode,s.started_at AS startedAt,s.ended_at AS endedAt,s.correct,s.wrong,s.total,s.incomplete FROM learning_sessions s JOIN learners l ON l.id=s.learner_id WHERE l.parent_id=? ORDER BY COALESCE(s.ended_at,s.started_at) DESC LIMIT 500`).bind(auth.parent_id).all();
  const baselineMap={};for(const item of baselines.results||[]){try{baselineMap[item.learnerId]=JSON.parse(item.stateJson);}catch{}}
  return response(request,env,200,{baselines:baselineMap,attempts:(attempts.results||[]).map(item=>({...item,answer:JSON.parse(item.answerJson||'null'),correctAnswer:JSON.parse(item.correctAnswerJson||'null'),isCorrect:Boolean(item.isCorrect)})),sessions:sessions.results||[]});
}

export default{
  async fetch(request,env){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...corsHeaders(request,env),'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400'}});
    const url=new URL(request.url),path=url.pathname;
    if(path==='/health'&&request.method==='GET')return response(request,env,200,{ok:true,service:'family-learning-api'});
    if(path==='/v1/auth/register'&&request.method==='POST')return register(request,env);
    if(path==='/v1/auth/login'&&request.method==='POST')return login(request,env);
    const auth=await authenticate(request,env);if(!auth)return response(request,env,401,{error:'unauthorized'});
    if(path==='/v1/auth/logout'&&request.method==='POST')return logout(request,env,auth);
    if(path==='/v1/me'&&request.method==='GET')return response(request,env,200,{parent:{email:auth.email},learners:await learnersForParent(env,auth.parent_id)});
    if(path==='/v1/sync/baseline'&&request.method==='POST')return syncBaseline(request,env,auth);
    if(path==='/v1/sync/attempts'&&request.method==='POST')return syncAttempts(request,env,auth);
    if(path==='/v1/sync/session'&&request.method==='POST')return syncSession(request,env,auth);
    if(path==='/v1/sync/snapshot'&&request.method==='GET')return snapshot(request,env,auth);
    return response(request,env,404,{error:'not_found'});
  }
};
