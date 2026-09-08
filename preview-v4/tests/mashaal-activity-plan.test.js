import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';

test('Mashaal activity plan composes skill metadata instead of duplicating engines',()=>{
  const plan=createMashaalActivityPlan('patterns');
  assert.equal(plan.learnerId,'mashaal');
  assert.equal(plan.domainId,'cognitive-operations-general-knowledge');
  assert.ok(plan.activityTypes.includes('sequencing'));
  assert.deepEqual(plan.sequence,['listen','look','choose-or-manipulate','feedback','transfer']);
});
