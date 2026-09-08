import { listLearnerProfiles } from '../learners/learner-registry.js';
import { listCurricula } from '../curricula/curriculum-registry.js';

export function getFamilyLearningConfig(){
  return Object.freeze({learners:Object.freeze(listLearnerProfiles()),curricula:Object.freeze(listCurricula())});
}
