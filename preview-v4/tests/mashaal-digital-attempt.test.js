import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalDigitalAttempt } from '../src/modules/mashaal/application/digital-attempt.js';

test('Mashaal digital attempts remain learner scoped',()=>{
  const evidence=createMashaalDigitalAttempt({evidenceId:'d1',skillId:'patterns',isCorrect:true,responseMs:1200,createdAt:'2026-09-08T00:00:00Z'});
  assert.equal(evidence.learnerId,'mashaal');
  assert.equal(evidence.payload.isCorrect,true);
  assert.equal(evidence.payload.responseMs,1200);
});
