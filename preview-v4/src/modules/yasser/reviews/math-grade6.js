import {MATH_QUESTIONS,SOURCES} from './math-grade6-data.js';
import {createReviewController} from './review-runtime.js';
const controller=createReviewController({id:'math',label:'الرياضيات',questions:MATH_QUESTIONS,sources:SOURCES,assetBase:'assets/reviews/math-grade6'});
export const openYasserMathReview=controller.openReview;
