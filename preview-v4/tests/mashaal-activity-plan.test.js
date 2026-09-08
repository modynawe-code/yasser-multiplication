import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';

test('Mashaal activity plan composes skill metadata and verified catalog content',()=>{
  const plan=createMashaalActivityPlan('patterns');
  assert.equal(plan.learnerId,'mashaal');
  assert.equal(plan.domainId,'cognitive-operations-general-knowledge');
  assert.ok(plan.activityTypes.includes('sequencing'));
  assert.deepEqual(plan.sequence,['listen','look','choose-or-manipulate','feedback','transfer']);
  assert.equal(plan.contentReady,true);
  assert.equal(plan.activities.length,1);
  assert.equal(plan.activities[0].id,'kg3-pattern-01');
});

test('Mashaal activity plan stays closed when a skill has no verified activity content yet',()=>{
  const plan=createMashaalActivityPlan('oral-vocabulary-expression');
  assert.equal(plan.contentReady,false);
  assert.deepEqual(plan.activities,[]);
});
