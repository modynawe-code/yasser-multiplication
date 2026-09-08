import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalParentObservation } from '../src/modules/mashaal/application/parent-observation.js';

test('parent observations are learner-scoped learning evidence',()=>{
  const evidence=createMashaalParentObservation({evidenceId:'o1',skillId:'shapes-space',note:'وجدت شكلاً دائرياً في الغرفة',createdAt:'2026-09-08T00:00:00Z'});
  assert.equal(evidence.learnerId,'mashaal');
  assert.equal(evidence.type,'parent-observation');
});
