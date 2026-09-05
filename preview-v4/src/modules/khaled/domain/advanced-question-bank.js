import { createMeasurementRoundQuestion } from './measurement-question-bank.js';

export function createAdvancedKhaledRound({skillId,count=8,random=Math.random}={}){
  if(skillId==='measurement')return Array.from({length:count},(_,index)=>createMeasurementRoundQuestion(index,{random}));
  return null;
}
