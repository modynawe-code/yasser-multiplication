import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialKhaledState, normalizeKhaledState, recordKhaledAttempt } from '../src/modules/khaled/domain/state-model.js';

test('Khaled records every answer as a unique immutable ledger event',()=>{
  const state=createInitialKhaledState();
  const question={id:'q-1',type:'count-select',correctAnswer:3};
  const first=recordKhaledAttempt(state,{skillId:'numbers-0-5',isCorrect:false,question,answer:2,createdAt:'2026-09-05T01:00:00Z'});
  const second=recordKhaledAttempt(state,{skillId:'numbers-0-5',isCorrect:true,question,answer:3,createdAt:'2026-09-05T01:01:00Z'});
  assert.match(first.attemptId,/^kha-/);
  assert.notEqual(first.attemptId,second.attemptId);
  assert.equal(state.attemptLog.length,2);
  assert.equal(state.attemptLog[0].isCorrect,false);
  assert.equal(state.totalWrong,1);
  assert.equal(state.totalCorrect,1);
});

test('legacy Khaled totals survive schema migration as a baseline',()=>{
  const legacy=createInitialKhaledState();
  legacy.schemaVersion=1;
  delete legacy.attemptLog;
  delete legacy.ledgerBaseline;
  legacy.totalAttempts=12;legacy.totalCorrect=7;legacy.totalWrong=5;
  const migrated=normalizeKhaledState(legacy);
  assert.equal(migrated.schemaVersion,2);
  assert.deepEqual(migrated.attemptLog,[]);
  assert.equal(migrated.ledgerBaseline.attempts,12);
  recordKhaledAttempt(migrated,{skillId:'numbers-0-5',isCorrect:true,question:{id:'q-2',type:'count-select',correctAnswer:4},answer:4,createdAt:'2026-09-05T01:02:00Z'});
  const reloaded=normalizeKhaledState(JSON.parse(JSON.stringify(migrated)));
  assert.equal(reloaded.totalAttempts,13);
  assert.equal(reloaded.totalCorrect,8);
  assert.equal(reloaded.totalWrong,5);
  assert.equal(reloaded.attemptLog.length,1);
});
