import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialMashaalState } from '../src/modules/mashaal/domain/state-model.js';
import { summarizeMashaalDomains } from '../src/modules/mashaal/application/domain-progress.js';

test('Mashaal domain summary covers the six KG3 domains without percentages',()=>{
  const summary=summarizeMashaalDomains(createInitialMashaalState());
  assert.equal(summary.length,6);
  assert.ok(summary.every(item=>item.total>0));
  assert.ok(summary.every(item=>!('percentage' in item)));
});
