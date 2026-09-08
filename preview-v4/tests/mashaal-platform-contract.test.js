import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_PLATFORM_CONTRACT } from '../src/modules/mashaal/platform-contract.js';

test('Mashaal integration preserves offline and existing learner requirements',()=>{
  assert.equal(MASHAAL_PLATFORM_CONTRACT.worksOffline,true);
  assert.equal(MASHAAL_PLATFORM_CONTRACT.existingLearnerRegressionRequired,true);
});
