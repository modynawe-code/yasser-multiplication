import { isMeasurementQuestion, renderMeasurementQuestion } from './khaled-measurement-renderer.js';
import { isNumberPatternsQuestion, renderNumberPatternsQuestion } from './khaled-number-patterns-renderer.js';
import { isGeometryFractionsQuestion, renderGeometryFractionsQuestion } from './khaled-geometry-fractions-renderer.js';

export function isAdvancedQuestion(question){return isMeasurementQuestion(question)||isNumberPatternsQuestion(question)||isGeometryFractionsQuestion(question);}

export function renderAdvancedQuestion(args){
  if(isMeasurementQuestion(args.question))return renderMeasurementQuestion(args);
  if(isNumberPatternsQuestion(args.question))return renderNumberPatternsQuestion(args);
  if(isGeometryFractionsQuestion(args.question))return renderGeometryFractionsQuestion(args);
  return false;
}
