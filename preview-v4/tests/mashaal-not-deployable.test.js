import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('technical integration alone does not make Mashaal production ready before curriculum verification',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,false);
  assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false);
});
