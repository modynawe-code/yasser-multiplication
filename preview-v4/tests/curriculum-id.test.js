import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCurriculumId } from '../src/shared/curricula/curriculum-id.js';

test('curriculum ids are reusable generic slugs',()=>{
  assert.equal(normalizeCurriculumId(' Saudi-KG3 '),'saudi-kg3');
  assert.equal(normalizeCurriculumId('../bad'),null);
});
