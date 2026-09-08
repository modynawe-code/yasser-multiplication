import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_ADAPTATION_POLICY } from '../src/modules/mashaal/application/adaptation-policy.js';

test('Mashaal adaptation changes support rather than punishing errors',()=>{
  assert.equal(MASHAAL_ADAPTATION_POLICY.onRepeatedError,'change-representation');
  assert.equal(MASHAAL_ADAPTATION_POLICY.onMastery,'schedule-spaced-review');
});
