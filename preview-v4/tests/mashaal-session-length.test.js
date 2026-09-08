import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendedMashaalActivityCount } from '../src/modules/mashaal/application/session-length.js';

test('Mashaal KG3 sessions stay short',()=>{
  assert.equal(recommendedMashaalActivityCount({newSkill:true}),4);
  assert.equal(recommendedMashaalActivityCount({newSkill:false}),6);
});
