import test from 'node:test';
import assert from 'node:assert/strict';
import * as evidence from '../src/modules/mashaal/application/evidence.js';

test('Mashaal evidence API exposes all supported evidence paths',()=>{
  assert.equal(typeof evidence.createMashaalDigitalAttempt,'function');
  assert.equal(typeof evidence.createMashaalActivityCompletion,'function');
  assert.equal(typeof evidence.createMashaalParentObservation,'function');
  assert.equal(typeof evidence.recordMashaalEvidence,'function');
});
