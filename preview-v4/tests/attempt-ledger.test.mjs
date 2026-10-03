import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAttemptEvent, createLedgerBaseline, normalizeAttemptLog, summarizeAttemptLedger } from '../src/shared/data/attempt-ledger.js';

test('append-only ledger rejects duplicate attempt ids without deleting history',()=>{
  const state={attemptLog:[]};
  const event={attemptId:'att-1',learnerId:'khaled',isCorrect:false};
  assert.equal(appendAttemptEvent(state,event),true);
  assert.equal(appendAttemptEvent(state,{...event,isCorrect:true}),false);
  assert.equal(state.attemptLog.length,1);
  assert.equal(state.attemptLog[0].isCorrect,false);
  assert.equal(Object.isFrozen(state.attemptLog[0]),true);
});

test('normalization de-duplicates malformed persisted attempt history by id',()=>{
  const log=normalizeAttemptLog([{attemptId:'a',isCorrect:true},{attemptId:'a',isCorrect:false},null,{attemptId:''},{attemptId:'b',isCorrect:false}]);
  assert.deepEqual(log.map(item=>item.attemptId),['a','b']);
});

test('ledger summary combines preserved legacy baseline with new immutable events',()=>{
  const baseline=createLedgerBaseline({attempts:8,correct:5,wrong:3,capturedAt:'legacy'});
  const result=summarizeAttemptLedger({baseline,attemptLog:[{attemptId:'1',isCorrect:true},{attemptId:'2',isCorrect:false}]});
  assert.deepEqual(result,{attempts:10,correct:6,wrong:4,events:2});
});
