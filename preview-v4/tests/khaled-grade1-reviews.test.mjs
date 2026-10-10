import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
import {MATH_REVIEW,ARABIC_REVIEW} from '../src/modules/khaled/reviews/grade1-data.js';
import {gradeReviewAnswer,summarizeReview} from '../src/modules/yasser/reviews/review-engine.js';
import {bindReviewHandwriting} from '../src/modules/khaled/reviews/handwriting.js';
test('grade-one original coverage and child storage remain isolated',()=>{
 assert.equal(MATH_REVIEW.questions.length,7);assert.equal(ARABIC_REVIEW.questions.length,13);assert.notEqual(MATH_REVIEW.storageKey,ARABIC_REVIEW.storageKey);
 for(const review of [MATH_REVIEW,ARABIC_REVIEW]){assert.match(review.storageKey,/family:khaled:grade1:/);for(const q of review.questions){assert.equal(q.source.questions,review.sources.questions);assert.equal(q.source.answers,review.sources.answers);assert.equal(q.source.questionPage,1);assert.equal(q.source.answerPage,1);if(q.image)assert.ok(existsSync(new URL('../assets/reviews/grade1/'+q.image,import.meta.url)));}}
});
test('conflicting five-ball key is visible but never scored; all ordering cells required',()=>{
 const qs=MATH_REVIEW.questions;assert.ok(qs[5].sourceIssue);assert.equal(qs[5].fields.length,0);assert.equal(summarizeReview(qs,{}).total,6);assert.equal(summarizeReview(qs,{}).excluded,1);
 const order=qs[6];assert.ok(gradeReviewAnswer(order,['٠','١','٢','٣','٤','٥']).every(Boolean));assert.ok(!gradeReviewAnswer(order,['٠','١','٢','٣','٤']).every(Boolean));
});
test('unmarked long-sound answer key is excluded; handwriting awaits explicit comparison',()=>{
 const qs=ARABIC_REVIEW.questions;assert.ok(qs[0].sourceIssue);assert.equal(qs.filter(q=>q.handwriting&&q.selfReview).length,12);
 const responses=Object.fromEntries(qs.slice(1).map(q=>[q.id,{values:['كتابة بخط اليد'],correct:[],pending:true}]));const summary=summarizeReview(qs,responses);
 assert.equal(summary.total,12);assert.equal(summary.pending,12);assert.equal(summary.correct,0);assert.equal(summary.unanswered,0);assert.equal(summary.excluded,1);
});
test('pen input preserves strokes, restores drawing, handles cancellation and clear',()=>{
 const ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};let changes=0;
 const canvas={width:600,height:220,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:300,height:110}),setPointerCapture(){},setAttribute(){},toDataURL:()=> 'data:image/png;base64,test'};
 const clearButton={},strokes=[];bindReviewHandwriting({canvas,clearButton,strokes,onChange:()=>changes++});
 canvas.onpointerdown({preventDefault(){},pointerId:1,clientX:20,clientY:30});canvas.onpointermove({clientX:30,clientY:40});canvas.onpointercancel();assert.deepEqual(strokes,[[[20,20],[40,40]]]);assert.equal(changes,1);
 clearButton.onclick();assert.equal(strokes.length,0);assert.equal(changes,2);
});
