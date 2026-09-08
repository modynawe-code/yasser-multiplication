import { getLearnerProfile } from '../learners/learner-registry.js';

function listFrom(getter,state){const value=typeof getter==='function'?getter(state):[];return Array.isArray(value)?value:[];}

export function createFamilySyncCapabilityRegistry(){
  const entries=new Map();

  function register(learnerId,{repository,normalizeState,getAttempts=null,applyAttempt=null,getEvidence=null,applyEvidence=null,getSessions=null}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    if(!repository?.load||!repository?.save)throw new TypeError('sync capability requires repository');
    if(typeof normalizeState!=='function')throw new TypeError('sync capability requires normalizeState');
    const capability=Object.freeze({
      learnerId:profile.id,
      profile,
      repository,
      normalizeState,
      getAttempts:typeof getAttempts==='function'?getAttempts:null,
      applyAttempt:typeof applyAttempt==='function'?applyAttempt:null,
      getEvidence:typeof getEvidence==='function'?getEvidence:null,
      applyEvidence:typeof applyEvidence==='function'?applyEvidence:null,
      getSessions:typeof getSessions==='function'?getSessions:null
    });
    entries.set(profile.id,capability);
    return capability;
  }

  function get(learnerId){return entries.get(String(learnerId||''))||null;}
  function list(){return Object.freeze([...entries.values()]);}
  function load(capability){return capability.normalizeState(capability.repository.load());}
  function attempts(capability,state){return listFrom(capability.getAttempts,state);}
  function evidence(capability,state){return listFrom(capability.getEvidence,state);}
  function sessions(capability,state){return listFrom(capability.getSessions,state);}

  return Object.freeze({register,get,list,load,attempts,evidence,sessions});
}
