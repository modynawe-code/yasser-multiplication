import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_STATUS, canReleaseContent } from '../src/modules/mashaal/application/content-status.js';

test('Mashaal curriculum content releases only after source verification',()=>{
  assert.equal(canReleaseContent({status:CONTENT_STATUS.DRAFT,sourceVerified:true}),false);
  assert.equal(canReleaseContent({status:CONTENT_STATUS.VERIFIED,sourceVerified:false}),false);
  assert.equal(canReleaseContent({status:CONTENT_STATUS.VERIFIED,sourceVerified:true}),true);
});
