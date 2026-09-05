import { isMeasurementQuestion, renderMeasurementQuestion } from './khaled-measurement-renderer.js';
import { isNumberPatternsQuestion, renderNumberPatternsQuestion } from './khaled-number-patterns-renderer.js';
import { isGeometryFractionsQuestion, renderGeometryFractionsQuestion } from './khaled-geometry-fractions-renderer.js';
import { isMoneyQuestion, renderMoneyQuestion } from './khaled-money-renderer.js';

export function isAdvancedQuestion(question){return isMeasurementQuestion(question)||isNumberPatternsQuestion(question)||isGeometryFractionsQuestion(question)||isMoneyQuestion(question);}

export function renderAdvancedQuestion(args){
  if(isMeasurementQuestion(args.question))return renderMeasurementQuestion(args);
  if(isNumberPatternsQuestion(args.question))return renderNumberPatternsQuestion(args);
  if(isGeometryFractionsQuestion(args.question))return renderGeometryFractionsQuestion(args);
  if(isMoneyQuestion(args.question))return renderMoneyQuestion(args);
  return false;
}
