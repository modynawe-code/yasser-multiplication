import { createLearningEvidence } from '../../../shared/progress/evidence.js';

export function createMashaalDigitalAttempt({evidenceId,skillId,isCorrect,responseMs=null,createdAt}={}){
  return createLearningEvidence({evidenceId,learnerId:'mashaal',skillId,type:'digital-attempt',createdAt,payload:{isCorrect:Boolean(isCorrect),responseMs:Number.isFinite(Number(responseMs))?Math.max(0,Number(responseMs)):null}});
}
