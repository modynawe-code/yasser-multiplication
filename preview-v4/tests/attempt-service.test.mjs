import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, normalizeState } from '../src/domain/state-model.js';
import { recordAttempt } from '../src/application/attempt-service.js';

test('attempt event updates aggregate counters and appends immutable history',()=>{
  const state=createInitialState();
  const wrong=recordAttempt(state,{question:{table:3,multiplier:7},answer:20,responseMs:1200,createdAt:'2026-09-05T00:00:00Z'});
  const right=recordAttempt(state,{question:{table:3,multiplier:7},answer:21,responseMs:800,createdAt:'2026-09-05T00:01:00Z'});
  assert.equal(wrong.isCorrect,false);
  assert.equal(right.isCorrect,true);
  assert.equal(state.tables[3].facts[7].wrong,1);
  assert.equal(state.tables[3].facts[7].correct,1);
  assert.equal(state.totalAttempts,2);
  assert.equal(state.attemptLog.length,2);
  assert.match(state.attemptLog[0].attemptId,/^yas-/);
  assert.equal(state.attemptLog[0].learnerId,'yasser');
  assert.notEqual(state.attemptLog[0].attemptId,state.attemptLog[1].attemptId);
});

test('legacy Yasser aggregates become a migration baseline without inventing fake attempts',()=>{
  const legacy=createInitialState();
  legacy.schemaVersion=4;
  delete legacy.attemptLog;
  delete legacy.ledgerBaseline;
  legacy.totalAttempts=9;legacy.totalCorrect=6;legacy.totalWrong=3;
  const migrated=normalizeState(legacy);
  assert.equal(migrated.ledgerBaseline.attempts,9);
  assert.equal(migrated.ledgerBaseline.correct,6);
  assert.equal(migrated.ledgerBaseline.wrong,3);
  assert.deepEqual(migrated.attemptLog,[]);
  recordAttempt(migrated,{question:{table:2,multiplier:2},answer:4,responseMs:400,createdAt:'2026-09-05T00:02:00Z'});
  const reloaded=normalizeState(JSON.parse(JSON.stringify(migrated)));
  assert.equal(reloaded.totalAttempts,10);
  assert.equal(reloaded.totalCorrect,7);
  assert.equal(reloaded.totalWrong,3);
  assert.equal(reloaded.attemptLog.length,1);
});
