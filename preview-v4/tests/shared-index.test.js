import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from '../src/shared/index.js';

test('shared platform API separates learners, curricula, activities and progress',()=>{
  assert.equal(shared.Learners.getLearnerProfile('mashaal')?.stage,'kg3');
  assert.equal(shared.Curricula.getCurriculum('saudi-kg3')?.stage,'kg3');
  assert.equal(typeof shared.Activities.createActivityDefinition,'function');
  assert.equal(shared.Progress.DEVELOPMENTAL_STATUS.MASTERED,'mastered');
});
