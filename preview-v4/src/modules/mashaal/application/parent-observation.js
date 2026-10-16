import { createLearningEvidence } from '../../../shared/progress/evidence.js';

export function createMashaalParentObservation({evidenceId,skillId,note=null,createdAt}={}){
  return createLearningEvidence({evidenceId,learnerId:'mashaal',skillId,type:'parent-observation',createdAt,payload:note?{note:String(note).slice(0,500)}:null});
}
