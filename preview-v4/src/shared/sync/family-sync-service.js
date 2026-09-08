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
function ownedEvents(values,learnerId){return (Array.isArray(values)?values:[]).filter(item=>item?.learnerId===learnerId);}

export function createFamilySyncService({authClient,capabilityRegistry}={}){
  if(!authClient?.isAuthenticated||!authClient?.request||!capabilityRegistry?.list||!capabilityRegistry?.get||!capabilityRegistry?.load)throw new Error('Family sync dependencies are required');

  async function upload(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const loaded=capabilityRegistry.list().map(capability=>({capability,state:capabilityRegistry.load(capability)}));
    for(const {capability,state} of loaded)await authClient.request('/v1/sync/baseline',{method:'POST',body:{learnerId:capability.learnerId,state}});

    const attempts=loaded.flatMap(({capability,state})=>ownedEvents(capabilityRegistry.attempts?.(capability,state),capability.learnerId));
    for(const batch of chunks(attempts,200))if(batch.length)await authClient.request('/v1/sync/attempts',{method:'POST',body:{attempts:batch}});

    const evidence=loaded.flatMap(({capability,state})=>ownedEvents(capabilityRegistry.evidence?.(capability,state),capability.learnerId));
    for(const batch of chunks(evidence,200))if(batch.length)await authClient.request('/v1/sync/evidence',{method:'POST',body:{evidence:batch}});

    let sessions=0;
    for(const {capability,state} of loaded){
      const items=capabilityRegistry.sessions?.(capability,state)||[];
      for(const [index,session] of items.entries()){
        await authClient.request('/v1/sync/session',{method:'POST',body:sessionPayload(capability.learnerId,session,index)});
        sessions++;
      }
    }
    return{ok:true,learners:loaded.length,attempts:attempts.length,evidence:evidence.length,sessions};
  }

  async function restore(){
    if(!authClient.isAuthenticated())throw new Error('family_auth_required');
    const snapshot=await authClient.request('/v1/sync/snapshot'),capabilities=capabilityRegistry.list(),states=new Map(),applied={};
    for(const capability of capabilities){
      const hasBaseline=Object.prototype.hasOwnProperty.call(snapshot?.baselines||{},capability.learnerId);
      const source=hasBaseline?snapshot.baselines[capability.learnerId]:capability.repository.load();
      states.set(capability.learnerId,capability.normalizeState(source));
      applied[capability.learnerId]={attempts:0,evidence:0};
    }

    for(const event of snapshot?.attempts||[]){
      const capability=capabilityRegistry.get(event?.learnerId),state=states.get(event?.learnerId);
      if(!capability||!state||typeof capability.applyAttempt!=='function')continue;
      if(capability.applyAttempt(state,event))applied[capability.learnerId].attempts++;
    }
    for(const evidence of snapshot?.evidence||[]){
      const capability=capabilityRegistry.get(evidence?.learnerId),state=states.get(evidence?.learnerId);
      if(!capability||!state||typeof capability.applyEvidence!=='function')continue;
      if(capability.applyEvidence(state,evidence))applied[capability.learnerId].evidence++;
    }

    for(const capability of capabilities)capability.repository.save(states.get(capability.learnerId));
    const totals=Object.values(applied).reduce((sum,item)=>({attempts:sum.attempts+item.attempts,evidence:sum.evidence+item.evidence}),{attempts:0,evidence:0});
    return{ok:true,applied,attempts:totals.attempts,evidence:totals.evidence,requiresReload:true};
  }

  async function sync(){await upload();return restore();}
  return{upload,restore,sync};
}
