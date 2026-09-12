import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNER_REGISTRY_CONTRACT } from '../src/shared/learners/registry-contract.js';

test('family learner registry is intentionally open ended',()=>{
  assert.equal(LEARNER_REGISTRY_CONTRACT.openEnded,true);
  assert.equal(LEARNER_REGISTRY_CONTRACT.maxChildren,null);
  assert.equal(LEARNER_REGISTRY_CONTRACT.identityIsConfiguration,true);
});
