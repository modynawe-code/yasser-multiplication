import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {gradeReviewAnswer,summarizeReview,storageKeyFor,summarizeHistory} from '../src/modules/yasser/reviews/review-engine.js';
const subjects=['digital','arabic','english','science','social','islamic'];
const banks=await Promise.all(subjects.map(async s=>(await import(`../src/modules/yasser/reviews/${s}-grade6-data.js`)).REVIEW));
test('each subject preserves its source pair, coverage, original graphics and answer key',()=>{
 const counts=[19,27,36,158,29,20];
 for(const [i,b] of banks.entries()){
  assert.equal(b.questions.length,counts[i]);assert.equal(new Set(b.questions.map(q=>q.id)).size,counts[i]);
  for(const q of b.questions){assert.equal(q.source.questions,b.sources.questions);assert.equal(q.source.answers,b.sources.answers);assert.equal(q.page,q.source.questionPage);assert.equal(q.page,q.source.answerPage);assert.ok(q.page>=1&&q.page<=b.pages);assert.ok(q.source.quote);if(q.sourceIssue){assert.equal(q.fields.length,0);continue;}assert.ok(q.fields.length);assert.ok(gradeReviewAnswer(q,q.fields.map(f=>f.answer)).every(Boolean),q.id);if(q.choices)assert.ok(q.choices.includes(q.fields[0].answer),q.id);for(const image of [q.image,q.contextImage].filter(Boolean))assert.ok(existsSync(new URL('../assets/reviews/grade6/'+image,import.meta.url)),image);}
  const responses=Object.fromEntries(b.questions.filter(q=>!q.sourceIssue).map(q=>[q.id,{correct:gradeReviewAnswer(q,q.fields.map(f=>f.answer))}]));assert.equal(summarizeReview(b.questions,responses).percent,100);
 }
 const science=banks.find(b=>b.id==='science');for(let page=2;page<=21;page++)assert.ok(science.questions.some(q=>q.page===page),'science page '+page);
 assert.equal(new Set([...subjects,'math'].map(storageKeyFor)).size,7);
});
test('ambiguous source answers never enter the score and essays wait for self evaluation',()=>{
 const qs=[{id:'clear'},{id:'essay'},{id:'ambiguous',sourceIssue:'conflict'}];
 assert.deepEqual(summarizeReview(qs,{clear:{correct:[true]},essay:{correct:[],pending:true}}),{correct:1,wrong:0,unanswered:0,total:2,percent:50,pending:1,excluded:1,selfReviewed:0});
 const responses={clear:{correct:[true]},essay:{correct:[false],pending:false,selfReviewed:true}};
 assert.equal(summarizeReview(qs,responses).wrong,1);assert.equal(summarizeReview(qs,responses).selfReviewed,1);
 assert.equal(summarizeHistory([{mode:'exam',finished:true,ids:qs.map(q=>q.id),summary:{percent:50,pending:1}}],qs).bestFullExam,null);
});
test('English grading accepts case and final punctuation without accepting different sentences',()=>{
 const q=banks.find(b=>b.id==='english').questions.find(q=>q.fields[0]?.answer==='is raining');
 assert.deepEqual(gradeReviewAnswer(q,['IS RAINING.']),[true]);assert.deepEqual(gradeReviewAnswer(q,['is rain']),[false]);
});
