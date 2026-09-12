import test from 'node:test';
import assert from 'node:assert/strict';
import { createActivityDefinition } from '../src/shared/activities/activity-contract.js';

test('shared activity definitions are learner and curriculum agnostic',()=>{
  const activity=createActivityDefinition({id:'a1',type:'matching',prompt:'طابقي',metadata:{skillId:'patterns'}});
  assert.equal(activity.type,'matching');
  assert.equal('learnerId' in activity,false);
});
