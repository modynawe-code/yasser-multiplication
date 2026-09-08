import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_ACTIVITY_CATALOG } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { validateMashaalKg3Activity,listReleasableMashaalKg3Activities } from '../src/modules/mashaal/application/activity-release-validator.js';

test('starter KG3 activity catalog is fully source-bound and releasable by contract',()=>{
  assert.equal(MASHAAL_KG3_ACTIVITY_CATALOG.length,8);
  const ids=new Set();
  for(const activity of MASHAAL_KG3_ACTIVITY_CATALOG){
    assert.equal(ids.has(activity.id),false,activity.id);
    ids.add(activity.id);
    assert.deepEqual(validateMashaalKg3Activity(activity),{valid:true,errors:[]});
  }
  assert.equal(listReleasableMashaalKg3Activities(MASHAAL_KG3_ACTIVITY_CATALOG).length,8);
});

test('starter activities remain child-appropriate and do not expose numeric scoring',()=>{
  for(const activity of MASHAAL_KG3_ACTIVITY_CATALOG){
    assert.equal(activity.stage,'kg3');
    assert.equal(activity.childFacingScore,false);
    assert.equal(activity.evidenceType,'digital-attempt');
    assert.ok(activity.audioPromptAr.length>0);
  }
});
