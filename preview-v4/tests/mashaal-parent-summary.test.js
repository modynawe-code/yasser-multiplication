import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { summarizeMashaalProgress } from '../src/modules/mashaal/application/parent-summary.js';

test('Mashaal parent summary reports developmental states rather than percentages',()=>{
  const state=createInitialMashaalState();
  state.skills.patterns.status='mastered';
  state.skills['count-and-quantity'].status='developing';
  const summary=summarizeMashaalProgress(state);
  assert.equal(summary.mastered,1);
  assert.equal(summary.developing,1);
  assert.ok(summary['not-started']>0);
  assert.equal('percentage' in summary,false);
});
