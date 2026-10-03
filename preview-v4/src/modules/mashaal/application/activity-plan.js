import { getMashaalSkill } from './skill-index.js';
import { listMashaalKg3ActivitiesBySkill } from '../curriculum/kg3-activity-catalog.js';
import { createMashaalRecitationActivities,isMashaalRecitationSkillId } from './recitation-activity-factory.js';
import { listValidatedMashaalRecitationActivities } from './recitation-release-validator.js';
import { listReleasableMashaalKg3Activities } from './activity-release-validator.js';

const BASE_RECITATION_SKILL_ID='listen-repeat';

export function createMashaalActivityPlan(skillId){
  const requestedSkillId=String(skillId||'');
  const recitationRequest=isMashaalRecitationSkillId(requestedSkillId);
  const resolvedSkillId=recitationRequest?BASE_RECITATION_SKILL_ID:requestedSkillId;
  const skill=getMashaalSkill(resolvedSkillId);
  if(!skill)return null;
  const curriculumActivities=requestedSkillId===resolvedSkillId?listMashaalKg3ActivitiesBySkill(skill.id):[];
  const recitationActivities=listValidatedMashaalRecitationActivities(createMashaalRecitationActivities(requestedSkillId));
  const activities=listReleasableMashaalKg3Activities([...curriculumActivities,...recitationActivities]);
  return Object.freeze({
    learnerId:'mashaal',
    skillId:requestedSkillId,
    domainId:skill.domainId,
    activityTypes:Object.freeze([...skill.activityTypes]),
    sequence:Object.freeze(['listen','look','choose-or-manipulate','feedback','transfer']),
    contentReady:activities.length>0,
    activities:Object.freeze([...activities])
  });
}
