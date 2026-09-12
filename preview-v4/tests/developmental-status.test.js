import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVELOPMENTAL_STATUS, normalizeDevelopmentalStatus } from '../src/shared/progress/developmental-status.js';

test('developmental progress uses qualitative child-appropriate states',()=>{
  assert.deepEqual(Object.values(DEVELOPMENTAL_STATUS),['not-started','developing','mastered']);
  assert.equal(normalizeDevelopmentalStatus('developing'),'developing');
  assert.equal(normalizeDevelopmentalStatus('invalid'),'not-started');
});
