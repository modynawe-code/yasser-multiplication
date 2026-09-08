import test from 'node:test';
import assert from 'node:assert/strict';
import * as learners from '../src/shared/learners/index.js';

test('shared learner API exposes open registry primitives',()=>{
  assert.equal(typeof learners.createLearnerRegistry,'function');
  assert.equal(learners.getLearnerProfile('mashaal')?.stage,'kg3');
  assert.equal(learners.LEARNER_REGISTRY_CONTRACT.openEnded,true);
});
