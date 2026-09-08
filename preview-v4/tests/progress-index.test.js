import test from 'node:test';
import assert from 'node:assert/strict';
import * as progress from '../src/shared/progress/index.js';

test('shared progress API supports developmental evidence',()=>{
  assert.equal(progress.DEVELOPMENTAL_STATUS.DEVELOPING,'developing');
  assert.equal(typeof progress.createLearningEvidence,'function');
});
