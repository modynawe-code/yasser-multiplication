import { createMeasurementRoundQuestion } from './measurement-question-bank.js';
import { createNumberPatternsRoundQuestion } from './number-patterns-question-bank.js';

export function createAdvancedKhaledRound({skillId,count=8,random=Math.random}={}){
  if(skillId==='measurement')return Array.from({length:count},(_,index)=>createMeasurementRoundQuestion(index,{random}));
  if(skillId==='number-patterns')return Array.from({length:count},(_,index)=>createNumberPatternsRoundQuestion(index,{random}));
  return null;
}
