import { MASHAAL_KG3_DOMAINS } from '../curriculum/kg3-curriculum.js';
import { getMashaalKg3Skills } from '../curriculum/kg3-skill-map.js';
import { MASHAAL_PARENT_STATUS_LABELS } from './parent-labels.js';
import { createMashaalActivityPlan } from './activity-plan.js';

const RECITATION_SKILL_ID='listen-repeat';

export function summarizeMashaalProgress(state){
  const skills=Object.values(state?.skills||{});
  return skills.reduce((summary,skill)=>{
    const status=skill?.status||'not-started';
    summary[status]=(summary[status]||0)+1;
    return summary;
  },{'not-started':0,developing:0,mastered:0});
}

function summarizeSkill(state,skill){
  const status=state?.skills?.[skill.id]?.status||'not-started';
  const plan=createMashaalActivityPlan(skill.id);
  const awaitingApprovedAudio=skill.id===RECITATION_SKILL_ID&&!plan.contentReady;
  return Object.freeze({
    id:skill.id,
    title:skill.title,
    status,
    statusLabel:MASHAAL_PARENT_STATUS_LABELS[status]||MASHAAL_PARENT_STATUS_LABELS['not-started'],
    contentReady:Boolean(plan.contentReady),
    contentState:plan.contentReady?'ready':awaitingApprovedAudio?'awaiting-approved-human-audio':'not-ready',
    contentLabel:plan.contentReady?'نشاط جاهز':awaitingApprovedAudio?'بانتظار صوت تلاوة معتمد':'المحتوى غير جاهز'
  });
}

export function buildMashaalParentSummary(state={}){
  const domains=MASHAAL_KG3_DOMAINS.map(domain=>{
    const skills=getMashaalKg3Skills(domain.id).map(skill=>summarizeSkill(state,skill));
    return Object.freeze({
      id:domain.id,
      title:domain.title,
      childTitle:domain.childTitle,
      skills:Object.freeze(skills),
      mastered:skills.filter(skill=>skill.status==='mastered').length,
      developing:skills.filter(skill=>skill.status==='developing').length,
      notStarted:skills.filter(skill=>skill.status==='not-started').length,
      ready:skills.filter(skill=>skill.contentReady).length
    });
  });
  const skills=domains.flatMap(domain=>domain.skills);
  return Object.freeze({
    developmental:summarizeMashaalProgress(state),
    totalSkills:skills.length,
    readySkills:skills.filter(skill=>skill.contentReady).length,
    blockedSkills:skills.filter(skill=>!skill.contentReady).length,
    awaitingApprovedHumanAudio:skills.filter(skill=>skill.contentState==='awaiting-approved-human-audio').length,
    domains:Object.freeze(domains)
  });
}
