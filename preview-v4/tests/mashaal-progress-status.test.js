import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { updateMashaalSkillStatus } from '../src/modules/mashaal/application/progress-status-service.js';

test('Mashaal status update stays qualitative',()=>{
  const state=createInitialMashaalState();
  state.skills.patterns.evidenceCount=3;
  assert.equal(updateMashaalSkillStatus(state,'patterns',{recentSuccesses:2,transferObserved:true}),true);
  assert.equal(state.skills.patterns.status,'mastered');
});
