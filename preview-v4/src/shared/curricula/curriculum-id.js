export function normalizeCurriculumId(value){
  const id=String(value||'').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,95}$/.test(id)?id:null;
}
