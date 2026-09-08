import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveMashaalDevelopmentalStatus } from '../src/modules/mashaal/application/mastery-policy.js';

test('Mashaal mastery requires repeated evidence plus transfer observation',()=>{
  assert.equal(deriveMashaalDevelopmentalStatus({}),'not-started');
  assert.equal(deriveMashaalDevelopmentalStatus({evidenceCount:3,recentSuccesses:2,transferObserved:false}),'developing');
  assert.equal(deriveMashaalDevelopmentalStatus({evidenceCount:3,recentSuccesses:2,transferObserved:true}),'mastered');
});
