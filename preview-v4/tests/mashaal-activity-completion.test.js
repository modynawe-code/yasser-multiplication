import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityCompletion } from '../src/modules/mashaal/application/activity-completion.js';

test('Mashaal activity completion is evidence rather than a child-facing score',()=>{
  const evidence=createMashaalActivityCompletion({evidenceId:'a1',skillId:'patterns',activityType:'sequencing',createdAt:'2026-09-08T00:00:00Z'});
  assert.equal(evidence.type,'activity-completion');
  assert.equal(evidence.payload.activityType,'sequencing');
  assert.equal('score' in evidence,false);
});
