import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNER_REGISTRY_CONTRACT } from '../src/shared/learners/registry-contract.js';
import { CURRICULUM_REGISTRY_CONTRACT } from '../src/shared/curricula/registry-contract.js';

test('learner and curriculum identity stay separate architectural concerns',()=>{
  assert.equal(LEARNER_REGISTRY_CONTRACT.curriculaAreReferences,true);
  assert.equal(CURRICULUM_REGISTRY_CONTRACT.learnerIndependent,true);
});
