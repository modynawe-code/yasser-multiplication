import test from 'node:test';
import assert from 'node:assert/strict';
import * as app from '../src/modules/mashaal/application/index.js';

test('Mashaal application module exposes composable KG3 services',()=>{
  assert.equal(typeof app.createMashaalActivityPlan,'function');
  assert.equal(typeof app.summarizeMashaalDomains,'function');
  assert.equal(typeof app.recordMashaalEvidence,'function');
});
