import test from 'node:test';
import assert from 'node:assert/strict';
import { getLearnerProfile } from '../src/shared/learners/learner-registry.js';

test('learner registry lookup fails closed without encoding a numeric family size cap',()=>{
  assert.equal(getLearnerProfile('unknown-child'),null);
});
