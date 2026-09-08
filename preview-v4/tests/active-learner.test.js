import test from 'node:test';
import assert from 'node:assert/strict';
import { createActiveLearnerState } from '../src/shared/learners/active-learner.js';

test('active learner state is generic',()=>{
  const active=createActiveLearnerState('yasser');
  assert.equal(active.get(),'yasser');
  assert.equal(active.set('mashaal'),true);
  assert.equal(active.get(),'mashaal');
  active.clear();
  assert.equal(active.get(),null);
});
