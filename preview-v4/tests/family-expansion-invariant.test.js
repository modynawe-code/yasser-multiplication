import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearnerRegistry } from '../src/shared/learners/runtime-registry.js';
import { createCurriculumRegistry } from '../src/shared/curricula/runtime-registry.js';

test('a future child and curriculum can be composed without editing existing learner modules',()=>{
  const curricula=createCurriculumRegistry([{id:'new-track',title:'مسار جديد'}]);
  const learners=createLearnerRegistry([{id:'new-child',displayName:'طفل جديد',curriculumIds:['new-track']}]);
  assert.equal(learners.get('new-child').curriculumIds[0],curricula.get('new-track').id);
});
