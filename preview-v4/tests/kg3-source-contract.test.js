import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurriculum } from '../src/shared/curricula/curriculum-registry.js';

test('Saudi KG3 registry keeps official stage metadata separate from module implementation',()=>{
  const curriculum=getCurriculum('saudi-kg3');
  assert.equal(curriculum.stage,'kg3');
  assert.equal(curriculum.ageRange,'5-6');
  assert.equal(curriculum.domains.length,6);
  assert.match(curriculum.authority,/Saudi Ministry of Education/);
});
