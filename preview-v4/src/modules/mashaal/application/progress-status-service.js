import { deriveMashaalDevelopmentalStatus } from './mastery-policy.js';

export function updateMashaalSkillStatus(state,skillId,signals={}){
  if(!state?.skills?.[skillId])return false;
  state.skills[skillId].status=deriveMashaalDevelopmentalStatus({evidenceCount:state.skills[skillId].evidenceCount,...signals});
  return true;
}
