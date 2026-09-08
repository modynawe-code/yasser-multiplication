import { MASHAAL_DATA_SCHEMA_VERSION } from './constants.js';
import { MASHAAL_KG3_DOMAINS } from '../curriculum/kg3-curriculum.js';
import { MASHAAL_KG3_SKILL_MAP } from '../curriculum/kg3-skill-map.js';
import { createMashaalSkillProgress, normalizeMashaalSkillProgress } from './progress-model.js';

export function createInitialMashaalState(){
  const skills={};
  for(const domain of MASHAAL_KG3_DOMAINS){
    for(const skill of MASHAAL_KG3_SKILL_MAP[domain.id]||[])skills[skill.id]=createMashaalSkillProgress();
  }
  return {schemaVersion:MASHAAL_DATA_SCHEMA_VERSION,learnerId:'mashaal',skills,evidenceLog:[],sessions:[]};
}

export function normalizeMashaalState(candidate){
  const state=candidate&&typeof candidate==='object'?candidate:createInitialMashaalState();
  if(!state.skills||typeof state.skills!=='object')state.skills={};
  for(const [skillId,blank] of Object.entries(createInitialMashaalState().skills))state.skills[skillId]=normalizeMashaalSkillProgress(state.skills[skillId]||blank);
  state.evidenceLog=Array.isArray(state.evidenceLog)?state.evidenceLog:[];
  state.sessions=Array.isArray(state.sessions)?state.sessions:[];
  state.learnerId='mashaal';
  state.schemaVersion=MASHAAL_DATA_SCHEMA_VERSION;
  return state;
}
