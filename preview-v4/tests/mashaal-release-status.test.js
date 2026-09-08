import test from 'node:test';
import assert from 'node:assert/strict';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

const technicallyIntegrated={
  foundationReady:true,
  hubIntegrated:true,
  parentIntegrated:true,
  backendIntegrated:true,
  regressionsGreen:true
};

test('Mashaal release requires technical integration and verified curriculum content',()=>{
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,contentVerified:false}),false);
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,contentVerified:true}),true);
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,regressionsGreen:false,contentVerified:true}),false);
});
