import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningEvidence } from '../src/shared/progress/evidence.js';

test('learning evidence is learner scoped and curriculum agnostic',()=>{
  const evidence=createLearningEvidence({evidenceId:'e1',learnerId:'mashaal',skillId:'patterns',type:'activity-completion',createdAt:'2026-09-08T00:00:00Z'});
  assert.equal(evidence.learnerId,'mashaal');
  assert.equal(evidence.skillId,'patterns');
  assert.equal(Object.isFrozen(evidence),true);
});
