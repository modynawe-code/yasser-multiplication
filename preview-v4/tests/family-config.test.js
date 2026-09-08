import test from 'node:test';
import assert from 'node:assert/strict';
import { getFamilyLearningConfig } from '../src/shared/family/family-config.js';

test('family config exposes learners and curricula as separate registries',()=>{
  const config=getFamilyLearningConfig();
  assert.deepEqual(config.learners.map(item=>item.id),['yasser','khaled','mashaal']);
  assert.ok(config.curricula.some(item=>item.id==='saudi-kg3'));
});
