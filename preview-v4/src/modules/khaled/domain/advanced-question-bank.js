import { createMeasurementRoundQuestion } from './measurement-question-bank.js';

export function createAdvancedRoundQuestion(skillId,index,{random=Math.random}={}){
  if(skillId==='measurement')return createMeasurementRoundQuestion(index,{random});
  return null;
}
