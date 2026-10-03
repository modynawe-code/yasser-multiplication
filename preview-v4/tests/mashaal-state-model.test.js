import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState, normalizeMashaalState } from '../src/modules/mashaal/domain/state-model.js';

test('Mashaal KG3 state initializes independent skill progress',()=>{
  const state=createInitialMashaalState();
  assert.equal(state.learnerId,'mashaal');
  assert.ok(Object.keys(state.skills).length>0);
  assert.equal(state.evidenceLog.length,0);
});

test('Mashaal state normalization preserves existing evidence and fills missing skills',()=>{
  const state=normalizeMashaalState({skills:{patterns:{status:'developing',evidenceCount:1}},evidenceLog:[{evidenceId:'e1'}]});
  assert.equal(state.skills.patterns.status,'developing');
  assert.equal(state.evidenceLog.length,1);
  assert.ok(state.skills['count-and-quantity']);
});
