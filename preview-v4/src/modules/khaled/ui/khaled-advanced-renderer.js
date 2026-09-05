import { isMeasurementQuestion, renderMeasurementQuestion } from './khaled-measurement-renderer.js';
import { isNumberPatternsQuestion, renderNumberPatternsQuestion } from './khaled-number-patterns-renderer.js';

export function isAdvancedQuestion(question){return isMeasurementQuestion(question)||isNumberPatternsQuestion(question);}

export function renderAdvancedQuestion(args){
  if(isMeasurementQuestion(args.question))return renderMeasurementQuestion(args);
  if(isNumberPatternsQuestion(args.question))return renderNumberPatternsQuestion(args);
  return false;
}
