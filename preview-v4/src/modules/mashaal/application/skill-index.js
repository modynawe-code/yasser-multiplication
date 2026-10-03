import { MASHAAL_KG3_DOMAINS } from '../curriculum/kg3-curriculum.js';
import { MASHAAL_KG3_SKILL_MAP } from '../curriculum/kg3-skill-map.js';

export function listMashaalSkills(){
  return MASHAAL_KG3_DOMAINS.flatMap(domain=>(MASHAAL_KG3_SKILL_MAP[domain.id]||[]).map(skill=>({...skill,domainId:domain.id})));
}

export function getMashaalSkill(skillId){
  return listMashaalSkills().find(skill=>skill.id===skillId)||null;
}
