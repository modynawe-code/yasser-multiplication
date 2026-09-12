import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_CONTENT_RELEASE_POLICY } from '../src/modules/mashaal/application/content-release-policy.js';

test('Saudi-specific Mashaal content cannot ship as unverified draft',()=>{
  assert.equal(MASHAAL_CONTENT_RELEASE_POLICY.allowUnverifiedDraftInProduction,false);
  assert.equal(MASHAAL_CONTENT_RELEASE_POLICY.quranIslamicContentRequiresVerification,true);
});
