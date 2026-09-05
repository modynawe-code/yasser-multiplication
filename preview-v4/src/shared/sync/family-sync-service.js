import { normalizeState, applyYasserAttemptEvent } from '../../domain/state-model.js';
import { normalizeKhaledState, applyKhaledAttemptEvent } from '../../modules/khaled/domain/state-model.js';

function chunks(values,size=200){const result=[];for(let i=0;i<values.length;i+=size)result.push(values.slice(i,i+size));return result;}
function sessionId(learner,session,index){
  const stamp=session.startedAt||session.endedAt||session.at||'unknown';
  const skill=session.skillId||session.mode||'session';
  return `${learner}-session-${stamp}-${skill}-${index}`.slice(0,180);
}
function sessionPayload(learner,session,index){
  return{
    sessionId:session.sessionId||sessionId(learner,session,index),
    learnerId:learner,
    skillId:session.skillId||null,
    mode:session.mode||null,
    startedAt:session.startedAt||null,
    endedAt:session.endedAt||session.at||null,
    correct:Number(session.correct||0),
    wrong:Number(session.wrong||0),
    total:Number(session.total||session.completed||0),
    incomplete:Boolean(session.incomplete)
  };
}

export function createFamilySyncService({authClient,yasserRepository,khaledRepository}={}){
  if(!authClient||!yasserRepository||!khaledRepository)throw new Error('Family sync dependencies are required');

  async function upload(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const yasser=normalizeState(yasserRepository.load()),khaled=normalizeKhaledState(khaledRepository.load());
    await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:'yasser',state:yasser}});
    await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:'khaled',state:khaled}});
    const attempts=[...yasser.attemptLog,...khaled.attemptLog];
    for(const batch of chunks(attempts,200))if(batch.length)await authClient.request('/v1/sync/attempts',{method:'POST',body:{attempts:batch}});
    for(const [index,session] of (yasser.sessions||[]).entries())await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload('yasser',session,index)});
    for(const [index,session] of (khaled.sessions||[]).entries())await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload('khaled',session,index)});
    return{ok:true,attempts:attempts.length,sessions:(yasser.sessions?.length||0)+(khaled.sessions?.length||0)};
  }

  async function restore(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const snapshot=await authClient.request('/v1/sync/snapshot');
    const yasser=normalizeState(snapshot.baselines?.yasser||yasserRepository.load());
    const khaled=normalizeKhaledState(snapshot.baselines?.khaled||khaledRepository.load());
    let appliedYasser=0,appliedKhaled=0;
    for(const event of snapshot.attempts||[]){
      if(event.learnerId==='yasser'&&applyYasserAttemptEvent(yasser,event))appliedYasser++;
      if(event.learnerId==='khaled'&&applyKhaledAttemptEvent(khaled,event))appliedKhaled++;
    }
    yasserRepository.save(yasser);khaledRepository.save(khaled);
    return{ok:true,appliedYasser,appliedKhaled,requiresReload:true};
  }

  async function sync(){await upload();return restore();}
  return{upload,restore,sync};
}
