import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_SOURCE_REGISTRY } from '../src/modules/mashaal/curriculum/source-registry.js';

test('Mashaal KG3 official stage metadata has provenance',()=>{
  const source=MASHAAL_SOURCE_REGISTRY['saudi-curriculum-guide-2025'];
  assert.equal(source.year,2025);
  assert.ok(source.supports.includes('kg3-six-learning-domains'));
});
