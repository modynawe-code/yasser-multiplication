import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalSkillProgress, normalizeMashaalSkillProgress } from '../src/modules/mashaal/domain/progress-model.js';

test('Mashaal skill progress starts ungraded and qualitative',()=>{
  assert.deepEqual(createMashaalSkillProgress(),{status:'not-started',evidenceCount:0,lastEvidenceAt:null});
  assert.deepEqual(normalizeMashaalSkillProgress({status:'developing',evidenceCount:2,lastEvidenceAt:'2026-09-08T00:00:00Z'}),{status:'developing',evidenceCount:2,lastEvidenceAt:'2026-09-08T00:00:00Z'});
});
