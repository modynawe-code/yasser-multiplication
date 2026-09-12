import { getMashaalKg3Skills } from '../curriculum/kg3-skill-map.js';
import { createMashaalActivityPlan } from '../application/activity-plan.js';

export function getMashaalDomainSkills(domainId){
  return getMashaalKg3Skills(domainId).map(skill=>{
    const plan=createMashaalActivityPlan(skill.id);
    return Object.freeze({
      id:skill.id,
      title:skill.title,
      contentReady:Boolean(plan?.contentReady),
      activityCount:plan?.activities?.length||0
    });
  });
}
