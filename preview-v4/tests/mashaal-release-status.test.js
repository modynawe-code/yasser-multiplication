import test from 'node:test';
import assert from 'node:assert/strict';
import { isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

const technicallyIntegrated={
  foundationReady:true,
  hubIntegrated:true,
  parentIntegrated:true,
  backendIntegrated:true,
  regressionsGreen:true,
  contentVerified:true
};

test('Mashaal release requires technical integration, verified content and required media',()=>{
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,requiredMediaReady:false}),false);
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,requiredMediaReady:true}),true);
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,regressionsGreen:false,requiredMediaReady:true}),false);
  assert.equal(isMashaalReleaseReady({...technicallyIntegrated,contentVerified:false,requiredMediaReady:true}),false);
});
