import { getMashaalKg3Skills } from '../curriculum/kg3-skill-map.js';
import { createMashaalActivityPlan } from '../application/activity-plan.js';
import { listMashaalRecitationChoices } from '../application/recitation-activity-factory.js';

function skillCard(id,title){
  const plan=createMashaalActivityPlan(id);
  return Object.freeze({
    id,
    title,
    contentReady:Boolean(plan?.contentReady),
    activityCount:plan?.activities?.length||0
  });
}

export function getMashaalDomainSkills(domainId){
  return getMashaalKg3Skills(domainId).flatMap(skill=>{
    if(skill.id==='listen-repeat'){
      const recitations=listMashaalRecitationChoices();
      if(recitations.length)return recitations.map(item=>skillCard(item.id,item.title));
    }
    return [skillCard(skill.id,skill.title)];
  });
}
