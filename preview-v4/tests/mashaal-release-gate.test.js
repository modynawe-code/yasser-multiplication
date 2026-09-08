import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal technical integration and content are verified while approved recitation media still gates full release',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.foundationReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.hubIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.parentIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.backendIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.verifiedSkills,25);
  assert.equal(MASHAAL_RELEASE_GATE.readyActivities,24);
  assert.equal(MASHAAL_RELEASE_GATE.blockedActivities,1);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');
});
