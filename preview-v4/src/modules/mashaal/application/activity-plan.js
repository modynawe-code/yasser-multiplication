import { getMashaalSkill } from './skill-index.js';
import { listMashaalKg3ActivitiesBySkill } from '../curriculum/kg3-activity-catalog.js';
import { createMashaalRecitationActivities } from './recitation-activity-factory.js';
import { listValidatedMashaalRecitationActivities } from './recitation-release-validator.js';
import { listReleasableMashaalKg3Activities } from './activity-release-validator.js';

export function createMashaalActivityPlan(skillId){
  const skill=getMashaalSkill(skillId);
  if(!skill)return null;
  const curriculumActivities=listMashaalKg3ActivitiesBySkill(skill.id);
  const recitationActivities=listValidatedMashaalRecitationActivities(createMashaalRecitationActivities(skill.id));
  const activities=listReleasableMashaalKg3Activities([...curriculumActivities,...recitationActivities]);
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
