import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_RELEASE_MANIFEST } from '../src/modules/mashaal/curriculum/release-manifest.js';

test('only source-backed KG3 foundation is verified at initial integration',()=>{
  const verified=Object.entries(MASHAAL_KG3_RELEASE_MANIFEST).filter(([,entry])=>entry.status==='verified').map(([key])=>key);
  assert.deepEqual(verified,['foundation']);
});
