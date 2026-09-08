import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal technical integration is complete while curriculum release remains gated',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.foundationReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.hubIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.parentIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.backendIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,false);
});
