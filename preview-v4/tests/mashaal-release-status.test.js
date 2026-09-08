import test from 'node:test';
import assert from 'node:assert/strict';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('Mashaal release requires all integration gates',()=>{
  assert.equal(isMashaalReleaseReady({foundationReady:true,hubIntegrated:true,parentIntegrated:true,backendIntegrated:true,regressionsGreen:false}),false);
  assert.equal(isMashaalReleaseReady({foundationReady:true,hubIntegrated:true,parentIntegrated:true,backendIntegrated:true,regressionsGreen:true}),true);
});
