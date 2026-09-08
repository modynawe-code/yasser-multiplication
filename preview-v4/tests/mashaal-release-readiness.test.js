import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { getMashaalReleaseBlockers,isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('Mashaal release gate records verified integration without claiming production readiness',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.verifiedSkills,25);
  assert.equal(MASHAAL_RELEASE_GATE.readyActivities,MASHAAL_RELEASE_GATE.requiredMediaReady?25:24);
  assert.equal(MASHAAL_RELEASE_GATE.blockedActivities,MASHAAL_RELEASE_GATE.requiredMediaReady?0:1);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,MASHAAL_RELEASE_GATE.requiredMediaReady?null:'approved-human-recitation-audio');
  assert.equal(MASHAAL_RELEASE_GATE.contentVerified,true);
  assert.equal(MASHAAL_RELEASE_GATE.familyGamesIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.cloudSyncIntegrated,true);
  assert.equal(MASHAAL_RELEASE_GATE.exactSessionRestoreReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.approvedRecitationSource,true);
  assert.equal(MASHAAL_RELEASE_GATE.manualVisualQaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.productionMigrationApplied,false);
  assert.equal(MASHAAL_RELEASE_GATE.syntheticRecitationAllowed,false);
  assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false);
});

test('current production blockers derive from actual media readiness plus manual QA and controlled migration',()=>{
  const expected=[];
  if(!MASHAAL_RELEASE_GATE.requiredMediaReady)expected.push('approved-human-recitation-audio');
  expected.push('manual-galaxy-tab-visual-qa','controlled-production-d1-migration');
  assert.deepEqual(getMashaalReleaseBlockers(MASHAAL_RELEASE_GATE),expected);
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
});
