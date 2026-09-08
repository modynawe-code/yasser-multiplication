import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearnerRegistry } from '../src/shared/learners/runtime-registry.js';

test('runtime learner registry can accept a fourth child without code changes',()=>{
  const registry=createLearnerRegistry([{id:'yasser',displayName:'ياسر'}]);
  registry.register({id:'child-four',displayName:'طفل رابع',stage:'kg2'});
  assert.equal(registry.get('child-four')?.stage,'kg2');
  assert.equal(registry.list().length,2);
});
