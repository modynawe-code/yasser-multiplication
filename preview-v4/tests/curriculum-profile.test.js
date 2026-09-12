import test from 'node:test';
import assert from 'node:assert/strict';
import { createCurriculumProfile } from '../src/shared/curricula/curriculum-profile.js';

test('curriculum profiles can be added independently from learners',()=>{
  const curriculum=createCurriculumProfile({id:'future-curriculum',title:'منهج جديد',stage:'kg2',module:'future'});
  assert.equal(curriculum.id,'future-curriculum');
  assert.equal(curriculum.stage,'kg2');
});
