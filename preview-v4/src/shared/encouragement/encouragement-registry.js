import { getLearnerProfile } from '../learners/learner-registry.js';

function normalizeEntry(entry){
  if(typeof entry==='string')return Object.freeze({text:entry.trim(),voiceKey:null,characterState:null});
  if(!entry||typeof entry!=='object')throw new TypeError('encouragement entry is invalid');
  const text=String(entry.text||'').trim();
  if(!text)throw new TypeError('encouragement text is required');
  return Object.freeze({
    ...entry,
    text,
    voiceKey:entry.voiceKey?String(entry.voiceKey).trim():null,
    characterState:entry.characterState?String(entry.characterState).trim():null
  });
}

function normalizeCues(cues){
  if(!cues||typeof cues!=='object'||Array.isArray(cues))throw new TypeError('encouragement cues must be an object');
  const normalized={};
  for(const [cue,entries] of Object.entries(cues)){
    const key=String(cue||'').trim();
    if(!key)continue;
    if(!Array.isArray(entries)||!entries.length)throw new TypeError(`encouragement cue must contain entries: ${key}`);
    normalized[key]=Object.freeze(entries.map(normalizeEntry));
  }
  return Object.freeze(normalized);
}

export function createEncouragementRegistry(){
  const packs=new Map();

  function register(learnerId,{cues={}}={}){
    const profile=getLearnerProfile(learnerId);
    if(!profile)throw new TypeError('registered learner is required');
    if(packs.has(profile.id))throw new Error(`encouragement pack already registered: ${profile.id}`);
    const pack=Object.freeze({learnerId:profile.id,cues:normalizeCues(cues)});
    packs.set(profile.id,pack);
    return pack;
  }

  function get(learnerId){return packs.get(String(learnerId||'').trim().toLowerCase())||null;}

  function resolve(learnerId,cue,{index=0}={}){
    const entries=get(learnerId)?.cues?.[String(cue||'').trim()]||[];
    if(!entries.length)return null;
    const safeIndex=Math.abs(Number.isInteger(index)?index:0)%entries.length;
    return entries[safeIndex];
  }

  return Object.freeze({register,get,resolve});
}
