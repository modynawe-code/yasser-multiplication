export const DEFAULT_LEARNERS=Object.freeze([
  Object.freeze({slug:'yasser',displayName:'ياسر'}),
  Object.freeze({slug:'khaled',displayName:'خالد'}),
  Object.freeze({slug:'mashaal',displayName:'مشاعل'})
]);

export function normalizeLearnerSlug(value){
  const slug=String(value||'').trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)?slug:'';
}

export function isValidLearnerSlug(value){
  return Boolean(normalizeLearnerSlug(value));
}
