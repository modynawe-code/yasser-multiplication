import { isSupportedActivityType } from '../../../shared/activities/activity-types.js';
import { isSupportedActivityPresentationType } from '../../../shared/activities/activity-renderer-contracts.js';
import { getMashaalSkill } from './skill-index.js';
import { getMashaalKg3SkillProvenance } from '../curriculum/kg3-skill-provenance.js';
import { MASHAAL_SOURCE_REGISTRY } from '../curriculum/source-registry.js';

export function validateMashaalKg3Activity(activity){
  const errors=[];
  if(!activity||typeof activity!=='object')return Object.freeze({valid:false,errors:Object.freeze(['activity-required'])});

  const skill=getMashaalSkill(activity.skillId);
  if(!skill)errors.push('unknown-skill');

  const provenance=getMashaalKg3SkillProvenance(activity.skillId);
  if(!provenance||provenance.status!=='direct-indicator')errors.push('skill-provenance-not-direct');

  if(!MASHAAL_SOURCE_REGISTRY[activity.sourceId])errors.push('unknown-source');
  if(provenance&&activity.sourceId!==provenance.sourceId)errors.push('source-mismatch');

  if(!Array.isArray(activity.indicatorRefs)||activity.indicatorRefs.length===0){
    errors.push('indicator-refs-required');
  }else if(provenance){
    const allowed=new Set(provenance.indicatorRefs||[]);
    if(activity.indicatorRefs.some(ref=>!allowed.has(ref)))errors.push('indicator-ref-mismatch');
  }

  if(!isSupportedActivityType(activity.interaction))errors.push('unsupported-interaction');
  if(!isSupportedActivityPresentationType(activity.activityType))errors.push('unsupported-activity-type');
  if(activity.stage!=='kg3')errors.push('invalid-stage');
  if(activity.status!=='verified')errors.push('activity-not-verified');
  if(activity.childFacingScore!==false)errors.push('child-score-not-allowed');
  if(typeof activity.promptAr!=='string'||activity.promptAr.trim().length===0)errors.push('prompt-required');
  if(typeof activity.audioPromptAr!=='string'||activity.audioPromptAr.trim().length===0)errors.push('audio-prompt-required');
  if(!activity.evidenceType)errors.push('evidence-type-required');

  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function listReleasableMashaalKg3Activities(activities=[]){
  return activities.filter(activity=>validateMashaalKg3Activity(activity).valid);
}
