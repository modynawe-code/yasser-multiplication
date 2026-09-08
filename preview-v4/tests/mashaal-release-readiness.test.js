import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { getMashaalReleaseBlockers,isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('Mashaal release gate records verified integration without claiming production readiness',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.verifiedSkills,25);
  assert.equal(MASHAAL_RELEASE_GATE.readyActivities,24);
  assert.equal(MASHAAL_RELEASE_GATE.blockedActivities,1);
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,true);
  assert.equal(MASHAAL_RELEASE_GATE.familyGamesIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.cloudSyncIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.exactSessionRestoreReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.approvedRecitationSource,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.manualVisualQaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.productionMigrationApplied,false);
  assert.equal(MASHAAL_RELEASE_GATE.syntheticRecitationAllowed,false);
  assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false);
});

test('current production blockers are explicit and limited to media, manual visual QA and controlled migration',()=>{
  assert.deepEqual(getMashaalReleaseBlockers(MASHAAL_RELEASE_GATE),[
    'approved-human-recitation-audio',
    'manual-galaxy-tab-visual-qa',
    'controlled-production-d1-migration'
  ]);
});

test('release status can become ready without changing the readiness algorithm',()=>{
  const ready={...MASHAAL_RELEASE_GATE,requiredMediaReady:true,manualVisualQaReady:true,productionMigrationApplied:true,readyActivities:25,blockedActivities:0,blockerCode:null};
  assert.deepEqual(getMashaalReleaseBlockers(ready),[]);
  assert.equal(isMashaalReleaseReady(ready),true);
});

test('Mashaal validation docs point to the integration PR and do not retain PR 27 as the release target',async()=>{
  const checklist=await readFile(new URL('../src/modules/mashaal/validation-checklist.md',import.meta.url),'utf8');
  const current=await readFile(new URL('../src/modules/mashaal/current-state.md',import.meta.url),'utf8');
  assert.match(checklist,/PR #29/);
  assert.doesNotMatch(checklist,/PR #27/);
  assert.match(current,/Draft PR #29/);
  assert.match(current,/exactly three operational gates/);
});
