import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLearningAttempts,summarizeLearningWindows,learningLevel,MASTERY_WEIGHTS } from '../src/shared/progress/learning-metrics.js';

const at=(id,cycle,isCorrect,createdAt='2026-09-07T10:00:00Z',extra={})=>({attemptId:id,learnerId:'khaled',skillId:'money',questionId:cycle,learningCycleId:cycle,isCorrect,createdAt,...extra});

test('learning metrics separate first try, corrected, assisted and unresolved outcomes',()=>{
  const log=[
    at('a1','q1',true),
    at('a2','q2',false),at('a3','q2',true,'2026-09-07T10:01:00Z'),
    at('a4','q3',false),at('a5','q3',false,'2026-09-07T10:02:00Z'),at('a6','q3',true,'2026-09-07T10:03:00Z'),
    at('a7','q4',false)
  ];
  const summary=summarizeLearningAttempts(log,{learnerId:'khaled'});
  assert.equal(summary.questions,4);
  assert.equal(summary.rawAttempts,7);
  assert.equal(summary.firstTryCorrect,1);
  assert.equal(summary.correctedAfterError,1);
  assert.equal(summary.assistedCorrect,1);
  assert.equal(summary.unresolved,1);
  assert.equal(summary.historicalErrors,4);
  assert.equal(summary.firstTryAccuracy,25);
  assert.equal(summary.finalSuccessRate,75);
  assert.equal(summary.masteryPoints,MASTERY_WEIGHTS.firstTry+MASTERY_WEIGHTS.corrected+MASTERY_WEIGHTS.assisted);
  assert.equal(summary.masteryScore,44);
});

test('used hint forces assisted weight even when answer is eventually correct',()=>{
  const log=[at('h1','hinted',false),at('h2','hinted',true,'2026-09-07T10:01:00Z',{usedHint:true})];
  const summary=summarizeLearningAttempts(log);
  assert.equal(summary.assistedCorrect,1);assert.equal(summary.masteryScore,25);
});

test('today and week are view windows and do not delete all-time progress',()=>{
  const now=new Date('2026-09-07T12:00:00Z');
  const log=[at('old','old',true,'2026-08-20T10:00:00Z'),at('today','today',true,'2026-09-07T10:00:00Z')];
  const windows=summarizeLearningWindows(log,{now,learnerId:'khaled'});
  assert.equal(windows.today.questions,1);
  assert.equal(windows.week.questions,1);
  assert.equal(windows.all.questions,2);
});

test('learning level uses mastery score rather than raw historical error count',()=>{
  assert.equal(learningLevel({questions:0,masteryScore:0}).id,'not-started');
  assert.equal(learningLevel({questions:6,masteryScore:70}).id,'progressing');
  assert.equal(learningLevel({questions:12,masteryScore:84}).id,'mastered');
  assert.equal(learningLevel({questions:20,masteryScore:94}).id,'expert');
});
