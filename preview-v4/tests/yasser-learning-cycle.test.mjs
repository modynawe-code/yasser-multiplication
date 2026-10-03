import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state-model.js';
import { createSession,submitSessionAnswer,unlockNextQuestion,getSessionLearningSummary,buildSessionRecord } from '../src/application/training-engine.js';

test('Yasser retry stays in one learning cycle and receives corrected mastery weight',()=>{
  const state=createInitialState();
  const session=createSession({mode:'practice',state,selectedTables:[2],customQuestions:[{table:2,multiplier:3}]});
  const first=submitSessionAnswer({session,state,answer:5,now:session.currentQuestionStartedAt+400});
  assert.equal(first.attempt.isCorrect,false);
  assert.equal(first.attempt.attemptNumber,1);
  unlockNextQuestion(session);
  const retry=session.questions[session.index];
  assert.equal(retry.learningCycleId,first.attempt.learningCycleId);
  assert.equal(retry.attemptNumber,2);
  const second=submitSessionAnswer({session,state,answer:6,now:session.currentQuestionStartedAt+300});
  assert.equal(second.attempt.isCorrect,true);
  assert.equal(second.attempt.learningCycleId,first.attempt.learningCycleId);
  assert.equal(second.attempt.attemptNumber,2);
  const summary=getSessionLearningSummary(session);
  assert.equal(summary.questions,1);
  assert.equal(summary.rawAttempts,2);
  assert.equal(summary.firstTryCorrect,0);
  assert.equal(summary.correctedAfterError,1);
  assert.equal(summary.finalSuccessRate,100);
  assert.equal(summary.masteryScore,50);
  const record=buildSessionRecord(session);
  assert.equal(record.completed,1);
  assert.equal(record.correct,1);
  assert.equal(record.wrong,0);
  assert.equal(record.firstTryCorrect,0);
  assert.equal(record.correctedAfterError,1);
  assert.equal(record.masteryScore,50);
  assert.equal(record.rawAttempts,2);
});

test('Yasser exam wrong answer stays unresolved and never becomes a retry cycle',()=>{
  const state=createInitialState();
  const session=createSession({mode:'exam',state,selectedTables:[3],customQuestions:[{table:3,multiplier:4}]});
  const result=submitSessionAnswer({session,state,answer:11,now:session.currentQuestionStartedAt+250});
  assert.equal(result.done,true);
  assert.equal(session.questions.length,1);
  const summary=getSessionLearningSummary(session);
  assert.equal(summary.questions,1);
  assert.equal(summary.unresolved,1);
  assert.equal(summary.masteryScore,0);
  assert.equal(result.attempt.questionCompleted,true);
});
