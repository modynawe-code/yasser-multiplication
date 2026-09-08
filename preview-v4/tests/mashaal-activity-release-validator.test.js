import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMashaalKg3Activity } from '../src/modules/mashaal/application/activity-release-validator.js';
import { MASHAAL_KG3_ACTIVITY_CATALOG } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';

const clone=(activity,overrides={})=>({
  ...activity,
  indicatorRefs:[...activity.indicatorRefs],
  choices:activity.choices?[...activity.choices]:undefined,
  stimulus:activity.stimulus?{...activity.stimulus}:undefined,
  ...overrides
});

test('activity release rejects an indicator that does not belong to the skill',()=>{
  const invalid=clone(MASHAAL_KG3_ACTIVITY_CATALOG[0],{indicatorRefs:['CK 1.1.8']});
  const result=validateMashaalKg3Activity(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('indicator-ref-mismatch'));
});

test('activity release rejects child-facing scores and unverified content',()=>{
  const scored=validateMashaalKg3Activity(clone(MASHAAL_KG3_ACTIVITY_CATALOG[0],{childFacingScore:true}));
  assert.ok(scored.errors.includes('child-score-not-allowed'));
  const draft=validateMashaalKg3Activity(clone(MASHAAL_KG3_ACTIVITY_CATALOG[0],{status:'draft'}));
  assert.ok(draft.errors.includes('activity-not-verified'));
});

test('activity release rejects unknown sources and unsupported interaction types',()=>{
  const source=validateMashaalKg3Activity(clone(MASHAAL_KG3_ACTIVITY_CATALOG[0],{sourceId:'unknown'}));
  assert.ok(source.errors.includes('unknown-source'));
  const interaction=validateMashaalKg3Activity(clone(MASHAAL_KG3_ACTIVITY_CATALOG[0],{interaction:'quiz-grid'}));
  assert.ok(interaction.errors.includes('unsupported-interaction'));
});
