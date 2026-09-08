import { normalizeMashaalSkillProgress } from '../domain/progress-model.js';

export function recordMashaalEvidence(state,{skillId,evidence}={}){
  if(!state?.skills?.[skillId]||!evidence?.evidenceId)return false;
  if(state.evidenceLog.some(item=>item.evidenceId===evidence.evidenceId))return false;
  const progress=normalizeMashaalSkillProgress(state.skills[skillId]);
  progress.evidenceCount+=1;
  progress.lastEvidenceAt=evidence.createdAt||new Date().toISOString();
  if(progress.status==='not-started')progress.status='developing';
  state.skills[skillId]=progress;
  state.evidenceLog.push({...evidence,skillId,learnerId:'mashaal'});
  return true;
}
