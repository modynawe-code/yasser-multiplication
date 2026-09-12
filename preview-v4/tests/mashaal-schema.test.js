import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_DATA_SCHEMA_VERSION, MASHAAL_STORAGE_NAMESPACE } from '../src/modules/mashaal/domain/constants.js';

test('Mashaal data is versioned and learner-scoped',()=>{
  assert.equal(MASHAAL_DATA_SCHEMA_VERSION,1);
  assert.match(MASHAAL_STORAGE_NAMESPACE,/mashaal/);
});
