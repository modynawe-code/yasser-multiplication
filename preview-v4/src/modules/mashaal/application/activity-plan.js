import { getMashaalSkill } from './skill-index.js';

export function createMashaalActivityPlan(skillId){
  const skill=getMashaalSkill(skillId);
  if(!skill)return null;
  return Object.freeze({
    learnerId:'mashaal',
    skillId:skill.id,
    domainId:skill.domainId,
    activityTypes:Object.freeze([...skill.activityTypes]),
    sequence:Object.freeze(['listen','look','choose-or-manipulate','feedback','transfer'])
  });
}
