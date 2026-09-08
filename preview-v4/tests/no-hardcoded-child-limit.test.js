import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearnerProfile } from '../src/shared/learners/learner-profile.js';

test('profile factory accepts another valid child without changing registry implementation',()=>{
  const fourth=createLearnerProfile({id:'child-four',displayName:'طفل رابع'});
  assert.equal(fourth.id,'child-four');
});
