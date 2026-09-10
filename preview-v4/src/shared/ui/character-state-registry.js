import { normalizeLearnerId } from '../learners/learner-id.js';

function normalizeStateId(value){
  const id=String(value||'').trim().toLowerCase();
  return /^[a-z][a-z0-9-]{0,47}$/.test(id)?id:null;
}

function normalizePack(pack){
  if(!pack||typeof pack!=='object')throw new TypeError('character state pack is required');
  const defaultState=normalizeStateId(pack.defaultState);
  if(!defaultState)throw new TypeError('character state pack requires a valid defaultState');
  const source=pack.states&&typeof pack.states==='object'?pack.states:{};
  const states={};
  for(const [rawId,value] of Object.entries(source)){
    const id=normalizeStateId(rawId);
    if(!id||!value||typeof value!=='object')throw new TypeError(`invalid character state: ${rawId}`);
    const assetKey=String(value.assetKey||'').trim();
    if(!assetKey)throw new TypeError(`character state ${id} requires assetKey`);
    states[id]=Object.freeze({id,assetKey,role:String(value.role||id),motionKey:String(value.motionKey||''),artworkStatus:value.artworkStatus==='approved'?'approved':'pending'});
  }
  if(!states[defaultState])throw new TypeError('defaultState must exist in character state pack');
  return Object.freeze({defaultState,states:Object.freeze(states)});
}

export function createCharacterStateRegistry(){
  const packs=new Map();
  function register(learnerId,pack){
    const id=normalizeLearnerId(learnerId);
    if(!id)throw new TypeError('valid learnerId is required');
    if(packs.has(id))throw new Error(`character state pack already registered: ${id}`);
    const normalized=normalizePack(pack);packs.set(id,normalized);return normalized;
  }
  function getPack(learnerId){const id=normalizeLearnerId(learnerId);return id?packs.get(id)||null:null;}
  function resolve(learnerId,stateId){
    const pack=getPack(learnerId);if(!pack)return null;
    const id=normalizeStateId(stateId)||pack.defaultState;
    return pack.states[id]||pack.states[pack.defaultState];
  }
  function supports(learnerId,stateId){const pack=getPack(learnerId),id=normalizeStateId(stateId);return Boolean(pack&&id&&pack.states[id]);}
  function list(learnerId){const pack=getPack(learnerId);return pack?Object.values(pack.states):[];}
  return Object.freeze({register,getPack,resolve,supports,list});
}
