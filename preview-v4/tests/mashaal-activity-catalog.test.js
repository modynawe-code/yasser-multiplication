import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_ACTIVITY_CATALOG } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { validateMashaalKg3Activity,listReleasableMashaalKg3Activities } from '../src/modules/mashaal/application/activity-release-validator.js';

const READY_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason',
  'recognize-emotions','express-needs-feelings','turn-taking-sharing','seek-help-self-regulation',
  'healthy-habits','personal-safety','gross-motor','fine-motor','islamic-values-situations','family-community','saudi-identity-belonging','places-roles'
]);

test('reviewed KG3 catalog is fully source-bound and releasable by contract',()=>{
  assert.equal(MASHAAL_KG3_ACTIVITY_CATALOG.length,24);
  const ids=new Set(),skills=new Set();
  for(const activity of MASHAAL_KG3_ACTIVITY_CATALOG){
    assert.equal(ids.has(activity.id),false,activity.id);ids.add(activity.id);skills.add(activity.skillId);
    assert.deepEqual(validateMashaalKg3Activity(activity),{valid:true,errors:[]});
  }
  assert.deepEqual([...READY_SKILLS].sort(),[...skills].sort());
  assert.equal(listReleasableMashaalKg3Activities(MASHAAL_KG3_ACTIVITY_CATALOG).length,24);
});

test('Quran recitation skill stays out of playable catalog until approved human audio exists',()=>{
  assert.equal(MASHAAL_KG3_ACTIVITY_CATALOG.some(activity=>activity.skillId==='listen-repeat'),false);
});

test('starter activities remain child-appropriate and use honest evidence types without scores',()=>{
  const evidenceTypes=new Set();
  for(const activity of MASHAAL_KG3_ACTIVITY_CATALOG){
    assert.equal(activity.stage,'kg3');assert.equal(activity.childFacingScore,false);
    assert.ok(['digital-attempt','activity-completion'].includes(activity.evidenceType));evidenceTypes.add(activity.evidenceType);
    assert.ok(activity.audioPromptAr.length>0);
  }
  assert.deepEqual([...evidenceTypes].sort(),['activity-completion','digital-attempt']);
});
