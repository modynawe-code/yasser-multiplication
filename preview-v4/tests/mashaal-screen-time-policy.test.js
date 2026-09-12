import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_SCREEN_TIME_POLICY } from '../src/modules/mashaal/application/screen-time-policy.js';

test('Mashaal design explicitly alternates tablet and off-screen activity',()=>{
  assert.equal(MASHAAL_SCREEN_TIME_POLICY.alternateWithOffScreen,true);
  assert.equal(MASHAAL_SCREEN_TIME_POLICY.avoidLongContinuousSessions,true);
});
