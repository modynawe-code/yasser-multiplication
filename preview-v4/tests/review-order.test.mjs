import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewAttempt,questionForReviewAttempt,gradeReviewAnswer,canShuffleReviewChoices,sameReviewQuestionSet} from '../src/modules/yasser/reviews/review-engine.js';
import {MATH_QUESTIONS} from '../src/modules/yasser/reviews/math-grade6-data.js';
import {englishQuestionParts} from '../src/modules/yasser/reviews/english-review-audio.js';
const banks=[MATH_QUESTIONS,...await Promise.all(['digital','arabic','english','science','social','islamic'].map(async s=>(await import(`../src/modules/yasser/reviews/${s}-grade6-data.js`)).REVIEW.questions))];
test('all seven subjects keep first training lesson order and shuffle later training and exams',()=>{
 for(const qs of banks){
  const ids=qs.map(q=>q.id),first=createReviewAttempt(qs,{mode:'train',random:()=>0});
  assert.deepEqual(first.ids,ids);
  for(const options of [{mode:'exam'},{mode:'train',history:[first]},{mode:'train',active:first},{mode:'train',ids:ids.slice(0,3)}]){
   const attempt=createReviewAttempt(qs,{...options,random:()=>0});
   const expected=options.ids||ids;
   assert.ok(sameReviewQuestionSet(attempt.ids,expected));assert.notDeepEqual(attempt.ids,expected);
  }
  for(const q of qs.filter(canShuffleReviewChoices)){
   const shown=questionForReviewAttempt(q,first);
   assert.notDeepEqual(shown.choices,q.choices,q.id);
   assert.deepEqual([...shown.choices].sort(),[...q.choices].sort());
   assert.deepEqual(gradeReviewAnswer(shown,[q.fields[0].answer]),gradeReviewAnswer(q,[q.fields[0].answer]));
  }
 }
});
test('save/resume preserves order, drafts, responses, and source banks without rerandomizing',()=>{
 for(const qs of banks){
  const original=JSON.stringify(qs),a=createReviewAttempt(qs,{mode:'exam',random:()=>0});
  a.index=2;a.drafts[a.ids[2]]=['draft'];a.responses[a.ids[0]]={values:['answer'],correct:[true]};
  const resumed=JSON.parse(JSON.stringify(a));
  for(const q of qs)assert.deepEqual(questionForReviewAttempt(q,resumed),questionForReviewAttempt(q,a));
  assert.deepEqual(resumed,a);assert.equal(JSON.stringify(qs),original);
 }
});
test('legacy saved attempts keep original order and sequence-dependent choices stay fixed',()=>{
 const q={id:'q',choices:['first','second']};
 assert.equal(questionForReviewAttempt(q,{ids:['q']}),q);
 assert.equal(questionForReviewAttempt(q,{choiceOrders:{q:['first','unknown']}}),q);
 for(const fixed of [{...q,shuffleChoices:false},{...q,choices:['A','all of the above']},{...q,choices:['أ','جميع ما سبق']}])assert.equal(canShuffleReviewChoices(fixed),false);
 const fixed={...q,shuffleChoices:false};assert.equal(questionForReviewAttempt(fixed,createReviewAttempt([fixed],{mode:'exam'})),fixed);
 const a=createReviewAttempt(banks[0],{mode:'exam',randomize:false});assert.deepEqual(a.ids,banks[0].map(q=>q.id));assert.deepEqual(a.choiceOrders,{});
});
test('English narration and individual listening indexes follow visible shuffled choices',()=>{
 const qs=banks[3],a=createReviewAttempt(qs,{mode:'exam',random:()=>0});
 for(const q of qs.filter(q=>q.choices)){
  const shown=questionForReviewAttempt(q,a),parts=englishQuestionParts(shown);
  assert.equal(parts[0].text,q.prompt);
  assert.deepEqual(parts.slice(1),shown.choices.map((text,index)=>({text,index})));
  assert.ok(shown.choices.includes(q.fields[0].answer));
 }
});
test('score comparisons match question sets independently of shuffle order',()=>{
 assert.equal(sameReviewQuestionSet(['a','b','c'],['c','a','b']),true);
 assert.equal(sameReviewQuestionSet(['a','b'],['b','c']),false);
 assert.equal(sameReviewQuestionSet(['a','b'],['a','b','c']),false);
});
