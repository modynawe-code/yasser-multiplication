export const MASHAAL_EVIDENCE_TYPES = Object.freeze([
  'digital-attempt',
  'activity-completion',
  'parent-observation'
]);

export function isMashaalEvidenceType(type){
  return MASHAAL_EVIDENCE_TYPES.includes(String(type||''));
}
