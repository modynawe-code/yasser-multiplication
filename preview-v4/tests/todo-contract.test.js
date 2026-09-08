import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal technical integration and curriculum verification are complete while release blockers remain explicit',async()=>{
  assert.equal(MASHAAL_RELEASE_GATE.hubIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.parentIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.backendIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.regressionsGreen,true);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');

  const todo=await readFile(new URL('../src/modules/mashaal/TODO.md',import.meta.url),'utf8');
  assert.match(todo,/\[x\] Verify detailed KG3 curriculum content/);
  assert.match(todo,/\[ \] Add approved human recitation audio/);
  assert.match(todo,/\[ \] Apply the reviewed D1 migration/);
});
