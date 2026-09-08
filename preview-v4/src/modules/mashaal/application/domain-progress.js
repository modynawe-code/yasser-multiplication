import { MASHAAL_KG3_DOMAINS } from '../curriculum/kg3-curriculum.js';
import { MASHAAL_KG3_SKILL_MAP } from '../curriculum/kg3-skill-map.js';

export function summarizeMashaalDomains(state){
  return MASHAAL_KG3_DOMAINS.map(domain=>{
    const skills=MASHAAL_KG3_SKILL_MAP[domain.id]||[];
    const counts={'not-started':0,developing:0,mastered:0};
    for(const skill of skills){const status=state?.skills?.[skill.id]?.status||'not-started';counts[status]=(counts[status]||0)+1;}
    return {domainId:domain.id,title:domain.title,childTitle:domain.childTitle,total:skills.length,...counts};
  });
}
