import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_REGISTRY_CONTRACT } from '../src/shared/curricula/registry-contract.js';

test('curricula stay independent from learner identity',()=>{
  assert.equal(CURRICULUM_REGISTRY_CONTRACT.learnerIndependent,true);
  assert.equal(CURRICULUM_REGISTRY_CONTRACT.manyToManyReady,true);
});
