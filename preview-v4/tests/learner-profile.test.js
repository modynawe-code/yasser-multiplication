import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearnerProfile } from '../src/shared/learners/learner-profile.js';

test('learner profile factory supports future children without feature-code changes',()=>{
  const profile=createLearnerProfile({id:'future-child',displayName:'طفل جديد',stage:'kg2',curriculumIds:['future-curriculum']});
  assert.equal(profile.id,'future-child');
  assert.deepEqual(profile.curriculumIds,['future-curriculum']);
  assert.throws(()=>createLearnerProfile({id:'../bad',displayName:'x'}),/invalid learner id/);
});
