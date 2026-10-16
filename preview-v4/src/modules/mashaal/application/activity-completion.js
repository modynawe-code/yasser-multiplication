import { createLearningEvidence } from '../../../shared/progress/evidence.js';

export function createMashaalActivityCompletion({evidenceId,skillId,activityId=null,activityType,createdAt}={}){
  return createLearningEvidence({evidenceId,learnerId:'mashaal',skillId,type:'activity-completion',createdAt,payload:{activityId:String(activityId||''),activityType:String(activityType||'')}});
}
