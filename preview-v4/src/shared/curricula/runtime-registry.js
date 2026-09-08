import { createCurriculumProfile } from './curriculum-profile.js';

export function createCurriculumRegistry(initialCurricula=[]){
  const curricula=new Map();
  for(const input of initialCurricula){const curriculum=createCurriculumProfile(input);curricula.set(curriculum.id,curriculum);}
  return Object.freeze({
    get(id){return curricula.get(String(id||'').trim().toLowerCase())||null;},
    list(){return [...curricula.values()];},
    register(input){const curriculum=createCurriculumProfile(input);if(curricula.has(curriculum.id))throw new Error('curriculum already registered');curricula.set(curriculum.id,curriculum);return curriculum;}
  });
}
