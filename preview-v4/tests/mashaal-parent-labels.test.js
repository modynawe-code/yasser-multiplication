import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_PARENT_STATUS_LABELS } from '../src/modules/mashaal/application/parent-labels.js';

test('Mashaal parent labels are developmental and concise',()=>{
  assert.equal(MASHAAL_PARENT_STATUS_LABELS.developing,'تتطور');
  assert.equal(MASHAAL_PARENT_STATUS_LABELS.mastered,'متقنة');
});
