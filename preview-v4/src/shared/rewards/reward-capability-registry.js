import { getLearnerProfile } from '../learners/learner-registry.js';

const MODES=Object.freeze(['academic','developmental']);

function normalizeAnchor(value){
  const anchor=String(value||'').trim();
  return anchor||null;
}

export function createRewardCapabilityRegistry(){
  const entries=new Map();

  function register(learnerId,{mode='academic',getState=null,onEnter=null,motivationAnchor=null}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    if(!MODES.includes(mode))throw new TypeError('unsupported reward capability mode');
    const capability=Object.freeze({
      learnerId:profile.id,
      displayName:profile.displayName,
      mode,
      getState:typeof getState==='function'?getState:null,
      onEnter:typeof onEnter==='function'?onEnter:null,
      motivationAnchor:normalizeAnchor(motivationAnchor)
    });
    entries.set(profile.id,capability);
    return capability;
  }

  function get(learnerId){return entries.get(String(learnerId||''))||null;}
  function list({mode=null}={}){
    const values=[...entries.values()];
    return Object.freeze(mode?values.filter(item=>item.mode===mode):values);
  }
  function supports(learnerId,mode){
    const capability=get(learnerId);
    return Boolean(capability&&(!mode||capability.mode===mode));
  }

  return Object.freeze({register,get,list,supports});
}
