import { getMashaalSkill } from './skill-index.js';
import { listMashaalKg3ActivitiesBySkill } from '../curriculum/kg3-activity-catalog.js';
import { listReleasableMashaalKg3Activities } from './activity-release-validator.js';

export function createMashaalActivityPlan(skillId){
  const skill=getMashaalSkill(skillId);
  if(!skill)return null;
  const activities=listReleasableMashaalKg3Activities(listMashaalKg3ActivitiesBySkill(skill.id));
  return Object.freeze({
    learnerId:'mashaal',
    skillId:skill.id,
    domainId:skill.domainId,
    activityTypes:Object.freeze([...skill.activityTypes]),
    sequence:Object.freeze(['listen','look','choose-or-manipulate','feedback','transfer']),
    contentReady:activities.length>0,
    activities:Object.freeze([...activities])
  });
}
