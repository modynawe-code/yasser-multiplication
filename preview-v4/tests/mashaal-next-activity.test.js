import test from 'node:test';
import assert from 'node:assert/strict';
import { pickNextMashaalActivity } from '../src/modules/mashaal/application/next-activity.js';

test('Mashaal interaction selector avoids immediate same-type repetition when possible',()=>{
  const plan={activityTypes:['choice','matching']};
  assert.equal(pickNextMashaalActivity(plan,{lastType:'choice'}),'matching');
});
