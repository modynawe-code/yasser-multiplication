import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal integration gates accurately remain pending before wiring',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.hubIntegrated,false);
  assert.equal(MASHAAL_RELEASE_GATE.parentIntegrated,false);
  assert.equal(MASHAAL_RELEASE_GATE.backendIntegrated,false);
});
