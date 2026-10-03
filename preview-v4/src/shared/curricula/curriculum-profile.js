import { normalizeCurriculumId } from './curriculum-id.js';

export function createCurriculumProfile(input={}){
  const id=normalizeCurriculumId(input.id);
  if(!id)throw new TypeError('invalid curriculum id');
  const title=String(input.title||'').trim();
  if(!title)throw new TypeError('curriculum title is required');
  return Object.freeze({
    ...input,
    id,
    title,
    stage:String(input.stage||'').trim()||null,
    module:String(input.module||'').trim()||null
  });
}
