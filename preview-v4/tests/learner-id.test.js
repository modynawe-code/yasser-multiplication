import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLearnerId } from '../src/shared/learners/learner-id.js';

test('learner ids are generic bounded slugs rather than fixed child names',()=>{
  assert.equal(normalizeLearnerId(' Future-Child '),'future-child');
  assert.equal(normalizeLearnerId('../bad'),null);
  assert.equal(normalizeLearnerId(''),null);
});
