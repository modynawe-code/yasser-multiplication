import { normalizeLearnerId } from './learner-id.js';

export function createLearnerProfile(input={}){
  const id=normalizeLearnerId(input.id);
  if(!id)throw new TypeError('invalid learner id');
  const displayName=String(input.displayName||'').trim();
  if(!displayName)throw new TypeError('display name is required');
  const curriculumIds=Array.isArray(input.curriculumIds)?[...new Set(input.curriculumIds.map(String).filter(Boolean))]:[];
  const presentation=Object.freeze({
    subtitle:String(input.presentation?.subtitle||'').trim(),
    summary:String(input.presentation?.summary||'').trim(),
    symbol:String(input.presentation?.symbol||'').trim()
  });
  return Object.freeze({
    id,
    displayName,
    stage:String(input.stage||'').trim()||null,
    curriculumIds:Object.freeze(curriculumIds),
    module:String(input.module||'').trim()||null,
    theme:String(input.theme||'').trim()||null,
    presentation
  });
}
