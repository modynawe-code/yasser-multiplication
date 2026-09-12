import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { recordMashaalEvidence } from '../src/modules/mashaal/application/progress-service.js';

test('Mashaal evidence recording is idempotent and learner scoped',()=>{
  const state=createInitialMashaalState();
  const evidence={evidenceId:'e1',type:'activity-completion',createdAt:'2026-09-08T00:00:00Z'};
  assert.equal(recordMashaalEvidence(state,{skillId:'patterns',evidence}),true);
  assert.equal(recordMashaalEvidence(state,{skillId:'patterns',evidence}),false);
  assert.equal(state.skills.patterns.status,'developing');
  assert.equal(state.skills.patterns.evidenceCount,1);
  assert.equal(state.evidenceLog[0].learnerId,'mashaal');
});
