import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';
import { getMashaalReleaseBlockers, isMashaalReleaseReady } from '../src/modules/mashaal/release-status.js';

test('Mashaal visual QA preparation is complete while the real-device pass remains closed',()=>{
  assert.equal(MASHAAL_RELEASE_GATE.visualQaContractReady,true);
  assert.equal(MASHAAL_RELEASE_GATE.manualVisualQaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.syntheticRecitationAllowed,false);
  assert.equal(isMashaalReleaseReady(MASHAAL_RELEASE_GATE),false);
});

test('current Mashaal release gate reports only blockers that are still operationally open',()=>{
  const expected=[];
  if(!MASHAAL_RELEASE_GATE.requiredMediaReady)expected.push('approved-human-recitation-audio');
  expected.push('manual-galaxy-tab-visual-qa','controlled-production-d1-migration');
  assert.deepEqual(getMashaalReleaseBlockers(MASHAAL_RELEASE_GATE),expected);
});

test('automated visual QA preparation cannot substitute for the manual Galaxy Tab pass',()=>{
  const gate={...MASHAAL_RELEASE_GATE,requiredMediaReady:true,productionMigrationApplied:true};
  assert.equal(gate.visualQaContractReady,true);
  assert.equal(gate.manualVisualQaReady,false);
  assert.equal(isMashaalReleaseReady(gate),false);
  assert.deepEqual(getMashaalReleaseBlockers(gate),['manual-galaxy-tab-visual-qa']);
});

test('all operational blockers cleared makes the current contract release-ready',()=>{
  const gate={
    ...MASHAAL_RELEASE_GATE,
    requiredMediaReady:true,
    manualVisualQaReady:true,
    productionMigrationApplied:true
  };
  assert.deepEqual(getMashaalReleaseBlockers(gate),[]);
  assert.equal(isMashaalReleaseReady(gate),true);
});

test('removing the visual QA contract itself creates an architectural gate blocker',()=>{
  const gate={
    ...MASHAAL_RELEASE_GATE,
    requiredMediaReady:true,
    visualQaContractReady:false,
    manualVisualQaReady:true,
    productionMigrationApplied:true
  };
  assert.deepEqual(getMashaalReleaseBlockers(gate),['gate:visualQaContractReady']);
  assert.equal(isMashaalReleaseReady(gate),false);
});
