import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAttemptBatch, validateAttemptPayload, validateEvidenceBatch, validateEvidencePayload, validateSessionPayload } from '../src/validation.mjs';

const valid={attemptId:'kha-1',learnerId:'khaled',skillId:'numbers-0-5',questionId:'q1',questionType:'count-select',answer:2,correctAnswer:3,isCorrect:false,createdAt:'2026-09-05T17:00:00.000Z'};

test('attempt validation accepts safe generic learner slugs and bounded payloads',()=>{
  assert.equal(validateAttemptPayload(valid).ok,true);
  assert.equal(validateAttemptPayload({...valid,learnerId:'mashaal'}).ok,true);
  assert.equal(validateAttemptPayload({...valid,learnerId:'future-child'}).ok,true);
  assert.equal(validateAttemptPayload({...valid,learnerId:'Bad/Slug'}).ok,false);
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

test('generic learning evidence accepts safe child-owned identities and bounded payloads',()=>{
  const evidence={evidenceId:'ev-1',learnerId:'mashaal',skillId:'count-and-quantity',type:'activity-completion',payload:{completed:true},createdAt:'2026-09-08T05:00:00.000Z'};
  assert.equal(validateEvidencePayload(evidence).ok,true);
  assert.equal(validateEvidencePayload({...evidence,learnerId:'future-child',evidenceId:'ev-2'}).ok,true);
  assert.equal(validateEvidencePayload({...evidence,learnerId:'../bad'}).ok,false);
  assert.equal(validateEvidenceBatch({evidence:[evidence]}).ok,true);
  assert.equal(validateEvidenceBatch({evidence:Array.from({length:251},(_,i)=>({...evidence,evidenceId:`ev-${i}`}))}).ok,false);
});

test('learning session validation accepts safe generic identity and rejects malformed identity',()=>{
  assert.equal(validateSessionPayload({sessionId:'s1',learnerId:'yasser',total:10}).ok,true);
  assert.equal(validateSessionPayload({sessionId:'s2',learnerId:'mashaal',total:4}).ok,true);
  assert.equal(validateSessionPayload({sessionId:'s3',learnerId:'future-child',total:4}).ok,true);
  assert.equal(validateSessionPayload({sessionId:'s4',learnerId:'../intruder',total:10}).ok,false);
});
