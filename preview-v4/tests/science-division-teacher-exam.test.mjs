import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {YASSER_SCIENCE_TEACHER_DIVISION_QUESTIONS as questions} from '../src/modules/yasser/science/science-division-exam.js';
import {applyScienceAttempt,createScienceSession,getScienceDashboard,getScienceReviewQuestionIds,submitScienceAnswer,validateScienceBank} from '../src/modules/yasser/science/science-engine.js';

test('teacher worksheet items retain their supplied wording and answer formats',()=>{
  assert.equal(validateScienceBank({questions,assets:{}}).ok,true);
  assert.deepEqual(questions.slice(0,7).map(question=>question.type),['choice','choice','choice','trueFalse','trueFalse','trueFalse','matchingTable']);
  assert.equal(questions[0].prompt,'معظم خلايا الإنسان تحتوي على ..... كروموسوماً:');
  assert.equal(questions[0].answer,'٤٦');
  assert.equal(questions[3].prompt,'العملية المستمرة من النمو والانقسام والتعويض هي دورة الخلية.');
  assert.equal(questions[6].prompt,'أكمل الجدول التالي بما يناسبه:');
  assert.equal(questions[6].rows.length,5);
  assert.ok(questions.every(question=>question.unit==='division'&&['teacher-worksheet','teacher-reference'].includes(question.source.kind)));
});

test('the matching table scores each blank separately and includes partial errors in review',()=>{
  const table=questions.find(question=>question.type==='matchingTable');
  const session=createScienceSession({mode:'exam',count:1,questions:[table],preserveOrder:true});
  const answer={...table.answer,'same-chromosomes':'الانقسام المنصف'};
  const result=submitScienceAnswer({session,answer,answeredAt:'2026-09-29T16:00:00.000Z'});
  assert.equal(result.attempt.isCorrect,false);
  assert.equal(result.attempt.correctCount,4);
  assert.equal(result.attempt.wrongCount,1);
  assert.equal(session.correct,4);assert.equal(session.wrong,1);
  const progress=applyScienceAttempt({},result.attempt);
  assert.equal(progress.concepts[table.concept].correct,4);
  assert.equal(progress.concepts[table.concept].wrong,1);
  assert.deepEqual(getScienceReviewQuestionIds(progress),[table.id]);
});

test('teacher numeric exercise accepts Arabic and Western digits and scores one answer',()=>{
  const numeric=questions.find(question=>question.type==='shortAnswer');
  assert.ok(numeric);
  const session=createScienceSession({mode:'exam',count:1,questions:[numeric],preserveOrder:true});
  const result=submitScienceAnswer({session,answer:'8',answeredAt:'2026-09-29T16:00:00.000Z'});
  assert.equal(result.attempt.isCorrect,true);
  assert.equal(session.correct,1);assert.equal(session.wrong,0);
  const wrong=submitScienceAnswer({session:createScienceSession({mode:'exam',count:1,questions:[numeric],preserveOrder:true}),answer:'٩',answeredAt:'2026-09-29T16:00:00.000Z'});
  assert.equal(wrong.attempt.isCorrect,false);
});

test('weighted accuracy reflects each table blank, not one table-shaped question',()=>{
  const table=questions.find(question=>question.type==='matchingTable');
  const session=createScienceSession({mode:'exam',count:1,questions:[table],preserveOrder:true});
  const result=submitScienceAnswer({session,answer:{...table.answer,'same-chromosomes':'الانقسام المنصف'},answeredAt:'2026-09-29T16:00:00.000Z'});
  const dashboard=getScienceDashboard({attempts:[result.attempt],points:0});
  assert.equal(dashboard.total,5);assert.equal(dashboard.accuracy,80);
});

test('division exam uses the teacher-only question set, immediate correction, counts, and a saved resume checkpoint',()=>{
  const source=readFileSync(new URL('../src/modules/yasser/science/yasser-science.js',import.meta.url),'utf8');
  assert.match(source,/YASSER_SCIENCE_TEACHER_DIVISION_QUESTIONS/);
  assert.match(source,/scienceCorrectCount/);assert.match(source,/scienceWrongCount/);
  assert.match(source,/EXAM_CHECKPOINT_KEY/);assert.match(source,/resumeScienceExam/);
  assert.match(source,/إجابة غير صحيحة\. الإجابة الصحيحة:/);
  assert.match(source,/yasserScienceDivisionExamView/);assert.match(source,/scienceDivisionExamBack/);
  assert.match(source,/shortAnswer/);assert.match(source,/renderMatchingTable/);
});
