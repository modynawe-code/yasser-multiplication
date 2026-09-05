import { isMeasurementQuestion, renderMeasurementQuestion } from './khaled-measurement-renderer.js';

export function isAdvancedQuestion(question){return isMeasurementQuestion(question);}

export function renderAdvancedQuestion(args){
  if(isMeasurementQuestion(args.question))return renderMeasurementQuestion(args);
  return false;
}
