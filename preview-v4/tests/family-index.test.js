import test from 'node:test';
import assert from 'node:assert/strict';
import * as family from '../src/shared/family/index.js';

test('family API exposes open composition contract',()=>{
  assert.equal(family.FAMILY_ARCHITECTURE_VERSION,1);
  assert.equal(family.getFamilyLearningConfig().learners.length,3);
});
