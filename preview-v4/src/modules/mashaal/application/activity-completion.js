import { createLearningEvidence } from '../../../shared/progress/evidence.js';

export function createMashaalActivityCompletion({evidenceId,skillId,activityType,createdAt}={}){
  return createLearningEvidence({evidenceId,learnerId:'mashaal',skillId,type:'activity-completion',createdAt,payload:{activityType:String(activityType||'')}});
}
