import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAttemptBatch, validateAttemptPayload, validateSessionPayload } from '../src/validation.mjs';

const valid={attemptId:'kha-1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q1',questionType:'count-select',answer:2,correctAnswer:3,isCorrect:false,createdAt:'2026-09-05T17:00:00.000Z'};

test('attempt validation accepts only known learner slugs and bounded payloads',()=>{
  assert.equal(validateAttemptPayload(valid).ok,true);
  assert.equal(validateAttemptPayload({...valid,learnerId:'someone-else'}).ok,false);
  assert.equal(validateAttemptPayload({...valid,createdAt:'not-a-date'}).ok,false);
  assert.equal(validateAttemptPayload({...valid,responseMs:-1}).ok,false);
});

test('Yasser attempt validation requires a real multiplication fact coordinate',()=>{
  const yasser={...valid,attemptId:'yas-1',learnerId:'yasser',skillId:'table-3',table:3,multiplier:7,answer:21,correctAnswer:21,isCorrect:true};
  assert.equal(validateAttemptPayload(yasser).ok,true);
  assert.equal(validateAttemptPayload({...yasser,table:null}).ok,false);
  assert.equal(validateAttemptPayload({...yasser,multiplier:11}).ok,false);
});

test('attempt sync batch has a hard request-size count limit',()=>{
  assert.equal(validateAttemptBatch({attempts:[valid]}).ok,true);
  assert.equal(validateAttemptBatch({attempts:Array.from({length:251},(_,i)=>({...valid,attemptId:`x-${i}`}))}).ok,false);
});

test('learning session validation rejects unknown learner identity',()=>{
  assert.equal(validateSessionPayload({sessionId:'s1',learnerId:'yasser',total:10}).ok,true);
  assert.equal(validateSessionPayload({sessionId:'s1',learnerId:'intruder',total:10}).ok,false);
});
