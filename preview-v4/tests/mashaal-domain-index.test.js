import test from 'node:test';
import assert from 'node:assert/strict';
import * as domain from '../src/modules/mashaal/domain/index.js';

test('Mashaal domain API is isolated and versioned',()=>{
  assert.equal(typeof domain.createInitialMashaalState,'function');
  assert.equal(domain.MASHAAL_DATA_SCHEMA_VERSION,1);
});
