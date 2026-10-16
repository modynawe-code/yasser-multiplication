export const LEARNING_EVIDENCE_TYPES = Object.freeze([
  'digital-attempt',
  'activity-completion',
  'parent-observation'
]);

export function isLearningEvidenceType(value){
  return LEARNING_EVIDENCE_TYPES.includes(String(value||''));
}
