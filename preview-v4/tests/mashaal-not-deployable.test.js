import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('verified KG3 content still stays out of full release until approved recitation media exists',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');
  assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false);
});
