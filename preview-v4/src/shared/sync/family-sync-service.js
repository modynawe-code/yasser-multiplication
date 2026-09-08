import { normalizeState, applyYasserAttemptEvent } from '../../domain/state-model.js';
import { normalizeKhaledState, applyKhaledAttemptEvent } from '../../modules/khaled/domain/state-model.js';
import { normalizeMashaalState } from '../../modules/mashaal/domain/state-model.js';
import { recordMashaalEvidence } from '../../modules/mashaal/application/progress-service.js';

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

export function createFamilySyncService({authClient,yasserRepository,khaledRepository,mashaalRepository=null}={}){
  if(!authClient||!yasserRepository||!khaledRepository)throw new Error('Family sync dependencies are required');

  async function upload(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const yasser=normalizeState(yasserRepository.load()),khaled=normalizeKhaledState(khaledRepository.load());
    const mashaal=mashaalRepository?normalizeMashaalState(mashaalRepository.load()):null;
    await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:'yasser',state:yasser}});
    await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:'khaled',state:khaled}});
    if(mashaal)await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:'mashaal',state:mashaal}});
    const attempts=[...yasser.attemptLog,...khaled.attemptLog];
    for(const batch of chunks(attempts,200))if(batch.length)await authClient.request('/v1/sync/attempts',{method:'POST',body:{attempts:batch}});
    const evidence=mashaal?.evidenceLog||[];
    for(const batch of chunks(evidence,200))if(batch.length)await authClient.request('/v1/sync/evidence',{method:'POST',body:{evidence:batch}});
    for(const [index,session] of (yasser.sessions||[]).entries())await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload('yasser',session,index)});
    for(const [index,session] of (khaled.sessions||[]).entries())await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload('khaled',session,index)});
    if(mashaal)for(const [index,session] of (mashaal.sessions||[]).entries())await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload('mashaal',session,index)});
    return{ok:true,attempts:attempts.length,evidence:evidence.length,sessions:(yasser.sessions?.length||0)+(khaled.sessions?.length||0)+(mashaal?.sessions?.length||0)};
  }

  async function restore(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const snapshot=await authClient.request('/v1/sync/snapshot');
    const yasser=normalizeState(snapshot.baselines?.yasser||yasserRepository.load());
    const khaled=normalizeKhaledState(snapshot.baselines?.khaled||khaledRepository.load());
    const mashaal=mashaalRepository?normalizeMashaalState(snapshot.baselines?.mashaal||mashaalRepository.load()):null;
    let appliedYasser=0,appliedKhaled=0,appliedMashaal=0;
    for(const event of snapshot.attempts||[]){
      if(event.learnerId==='yasser'&&applyYasserAttemptEvent(yasser,event))appliedYasser++;
      if(event.learnerId==='khaled'&&applyKhaledAttemptEvent(khaled,event))appliedKhaled++;
    }
    if(mashaal){
      for(const evidence of snapshot.evidence||[]){
        if(evidence.learnerId==='mashaal'&&recordMashaalEvidence(mashaal,{skillId:evidence.skillId,evidence}))appliedMashaal++;
      }
    }
    yasserRepository.save(yasser);khaledRepository.save(khaled);if(mashaal)mashaalRepository.save(mashaal);
    return{ok:true,appliedYasser,appliedKhaled,appliedMashaal,requiresReload:true};
  }

  async function sync(){await upload();return restore();}
  return{upload,restore,sync};
}
