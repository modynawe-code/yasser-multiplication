import test from 'node:test';
import assert from 'node:assert/strict';
import { createActivityResult } from '../src/shared/activities/activity-result.js';

test('shared activity results do not encode learner identity',()=>{
  const result=createActivityResult({activityId:'a1',completed:true,success:true,responseMs:900});
  assert.equal(result.completed,true);
  assert.equal('learnerId' in result,false);
});
