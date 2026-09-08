import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal technical integration is complete while release blockers remain explicit',async()=>{
  assert.equal(MASHAAL_RELEASE_GATE.hubIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.parentIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.backendIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,false);

  const todo=await readFile(new URL('../src/modules/mashaal/TODO.md',import.meta.url),'utf8');
  assert.match(todo,/\[ \] Verify detailed KG3 curriculum content/);
  assert.match(todo,/\[ \] Apply the reviewed D1 migration/);
});
