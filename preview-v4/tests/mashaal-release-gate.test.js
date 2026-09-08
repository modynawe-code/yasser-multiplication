import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal does not claim full release before integration and regressions',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.foundationReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,false);
});
