import test from 'node:test';
import assert from 'node:assert/strict';
import * as curricula from '../src/shared/curricula/index.js';

test('shared curriculum API exposes open registry primitives',()=>{
  assert.equal(typeof curricula.createCurriculumRegistry,'function');
  assert.equal(curricula.getCurriculum('saudi-kg3')?.stage,'kg3');
});
