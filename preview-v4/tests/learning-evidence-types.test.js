import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_EVIDENCE_TYPES, isLearningEvidenceType } from '../src/shared/progress/evidence-types.js';

test('shared learning evidence types support developmental observation',()=>{
  assert.ok(LEARNING_EVIDENCE_TYPES.includes('parent-observation'));
  assert.equal(isLearningEvidenceType('digital-attempt'),true);
});
