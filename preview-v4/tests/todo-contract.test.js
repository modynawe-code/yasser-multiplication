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
  assert.equal(MASHAAL_RELEASE_GATE.approvedRecitationSource,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');

  const todo=await readFile(new URL('../src/modules/mashaal/TODO.md',import.meta.url),'utf8');
  assert.match(todo,/\[x\] Verify detailed KG3 curriculum content/);
  assert.match(todo,/\[x\] Select an explicitly reusable human recitation source/);
  assert.match(todo,/\[x\] Limit the recitation scope to one surah only: سورة الإخلاص \(112\)/);
  assert.match(todo,/\[ \] Import the approved سورة الإخلاص audio file/);
  assert.match(todo,/\[ \] Apply the reviewed D1 migration/);
});
