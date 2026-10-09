import test from 'node:test';
import assert from 'node:assert/strict';
import {MATH_QUESTIONS,SOURCES,gradeAnswer,summarize,WORKSHEET_QUESTIONS,REVIEW_CONTENT_QUESTIONS,motivationFor,reviewHistorySummary} from '../src/modules/yasser/reviews/math-grade6-data.js';
test('every question has an exact pair of source pages',()=>{assert.equal(MATH_QUESTIONS.length,42);assert.equal(new Set(MATH_QUESTIONS.map(q=>q.id)).size,42);for(const q of MATH_QUESTIONS){assert.equal(q.source.questions,SOURCES.questions);assert.equal(q.source.answers,SOURCES.answers);assert.equal(q.source.questionPage,q.source.answerPage);assert.ok(q.page>=2&&q.page<=6);assert.ok(gradeAnswer(q,q.fields.map(f=>f.answer)).every(Boolean));}});
test('Arabic and English input preserves the meaning of powers and prime factors',()=>{const find=id=>MATH_QUESTIONS.find(q=>q.id===id);assert.deepEqual(gradeAnswer(find('operations'),['56']),[true]);assert.deepEqual(gradeAnswer(find('operations'),['٥٦']),[true]);assert.deepEqual(gradeAnswer(find('power'),['٥³']),[true]);assert.deepEqual(gradeAnswer(find('power'),['53']),[false]);assert.deepEqual(gradeAnswer(find('factors-18'),['3*2*3']),[true]);assert.deepEqual(gradeAnswer(find('factors-18'),['2×9']),[false]);assert.deepEqual(gradeAnswer(find('operations'),['eval(56)']),[false]);});
test('compound questions earn one point only when complete',()=>{const table=MATH_QUESTIONS.find(q=>q.table);const responses={[table.id]:{correct:gradeAnswer(table,['5+3','8','6+3','8'])}};assert.deepEqual(summarize([table],responses),{correct:0,wrong:1,unanswered:0,total:1,percent:0});responses[table.id].correct=gradeAnswer(table,['5+3','8','6+3','9']);assert.equal(summarize([table],responses).correct,1);});
test('score counts each question once and keeps skipped questions separate',()=>{const qs=MATH_QUESTIONS.slice(0,3),responses={[qs[0].id]:{correct:[true]},[qs[1].id]:{correct:[false]}};assert.deepEqual(summarize(qs,responses),{correct:1,wrong:1,unanswered:1,total:3,percent:33});assert.deepEqual(summarize(qs,JSON.parse(JSON.stringify(responses))),summarize(qs,responses));});

test('original worksheet is preserved and every derived question has source evidence',()=>{
 assert.equal(WORKSHEET_QUESTIONS.length,15);assert.equal(REVIEW_CONTENT_QUESTIONS.length,27);
 for(const q of REVIEW_CONTENT_QUESTIONS){assert.equal(q.source.kind,'review-content');assert.ok(q.source.quote);assert.ok(q.choices.includes(q.fields[0].answer));}
 for(const id of ['def-prime','def-composite','one-class','one-factor','power-base','power-exponent','order-first','order-second','order-third','order-last','def-function','def-input','def-output','def-rule','def-chart','def-mean','def-range','def-median','def-mode'])assert.ok(REVIEW_CONTENT_QUESTIONS.some(q=>q.id===id));
});
test('encouragement tracks actual consecutive correct answers and resets on mistakes',()=>{
 const r={a:{correct:[true]},b:{correct:[true]},c:{correct:[true]}};assert.match(motivationFor(r),/3 إجابات صحيحة متتالية/);
 r.d={correct:[true,false]};assert.doesNotMatch(motivationFor(r),/متتالية/);assert.match(motivationFor(r),/ياسر|تتعلم/);
 r.e={correct:[true]};assert.doesNotMatch(motivationFor(r),/متتالية/);
});

test('history compares full exams only and preserves older and retry attempts',()=>{
 const attempt=(mode,ids,percent)=>({finished:true,mode,ids,summary:{percent}});
 const full=MATH_QUESTIONS.map(q=>q.id);
 const history=[attempt('exam',full,50),attempt('train',full,100),attempt('exam',full.slice(0,15),100),attempt('exam',[full[0]],100),attempt('exam',full,75)];
 assert.deepEqual(reviewHistorySummary(history),{total:5,exams:4,training:1,bestFullExam:75,improvement:25});
 assert.deepEqual(reviewHistorySummary([]),{total:0,exams:0,training:0,bestFullExam:null,improvement:null});
});
