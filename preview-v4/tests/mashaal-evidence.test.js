import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_EVIDENCE_TYPES, isMashaalEvidenceType } from '../src/modules/mashaal/progress/evidence-types.js';

test('Mashaal progress accepts digital, completion and parent observation evidence',()=>{
  assert.deepEqual(MASHAAL_EVIDENCE_TYPES,['digital-attempt','activity-completion','parent-observation']);
  assert.equal(isMashaalEvidenceType('parent-observation'),true);
  assert.equal(isMashaalEvidenceType('score-percent'),false);
});
