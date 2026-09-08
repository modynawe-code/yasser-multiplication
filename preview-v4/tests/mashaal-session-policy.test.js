import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_SESSION_POLICY } from '../src/modules/mashaal/application/session-policy.js';

test('Mashaal sessions prefer short guided non-punitive practice',()=>{
  assert.equal(MASHAAL_SESSION_POLICY.preferShortActivities,true);
  assert.equal(MASHAAL_SESSION_POLICY.useGuidedRetry,true);
  assert.equal(MASHAAL_SESSION_POLICY.usePunitiveErrorFeedback,false);
});
