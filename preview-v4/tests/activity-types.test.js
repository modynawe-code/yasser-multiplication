import test from 'node:test';
import assert from 'node:assert/strict';
import { EARLY_LEARNING_ACTIVITY_TYPES, isSupportedActivityType } from '../src/shared/activities/activity-types.js';

test('early-learning activity registry exposes reusable interaction primitives',()=>{
  assert.ok(EARLY_LEARNING_ACTIVITY_TYPES.includes('listening'));
  assert.ok(EARLY_LEARNING_ACTIVITY_TYPES.includes('guided-play'));
  assert.equal(isSupportedActivityType('matching'),true);
  assert.equal(isSupportedActivityType('unknown'),false);
});
