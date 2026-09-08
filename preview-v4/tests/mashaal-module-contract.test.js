import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_MODULE_CONTRACT } from '../src/modules/mashaal/module-contract.js';

test('Mashaal module is curriculum-driven and isolated from existing learner state',()=>{
  assert.equal(MASHAAL_MODULE_CONTRACT.curriculumId,'saudi-kg3');
  assert.equal(MASHAAL_MODULE_CONTRACT.reusesSharedActivityPrimitives,true);
  assert.equal(MASHAAL_MODULE_CONTRACT.isolatedFromExistingLearnerState,true);
});
