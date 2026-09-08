import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';
import { getMashaalRecitationMediaStatus } from '../src/modules/mashaal/curriculum/recitation-source-registry.js';

const READY_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason',
  'recognize-emotions','express-needs-feelings','turn-taking-sharing','seek-help-self-regulation',
  'healthy-habits','personal-safety','gross-motor','fine-motor','islamic-values-situations','family-community','saudi-identity-belonging','places-roles'
]);

test('Mashaal activity plan composes skill metadata and verified catalog content',()=>{
  const plan=createMashaalActivityPlan('patterns');assert.equal(plan.learnerId,'mashaal');assert.equal(plan.domainId,'cognitive-operations-general-knowledge');
  assert.ok(plan.activityTypes.includes('sequencing'));assert.deepEqual(plan.sequence,['listen','look','choose-or-manipulate','feedback','transfer']);
  assert.equal(plan.contentReady,true);assert.equal(plan.activities.length,1);assert.equal(plan.activities[0].id,'kg3-pattern-01');
});

test('all reviewed non-recitation KG3 skills have starter activity content',()=>{
  for(const skillId of READY_SKILLS){const plan=createMashaalActivityPlan(skillId);assert.equal(plan.contentReady,true,skillId);assert.ok(plan.activities.length>=1,skillId);}
});

test('Quran recitation readiness follows integrity-verified human media instead of a hardcoded state',()=>{
  const media=getMashaalRecitationMediaStatus();
  const plan=createMashaalActivityPlan('listen-repeat');
  assert.equal(plan.contentReady,media.localMediaReady);
  if(!media.localMediaReady){assert.deepEqual(plan.activities,[]);return;}
  assert.equal(plan.activities.length,1);
  const activity=plan.activities[0];
  assert.equal(activity.skillId,'listen-repeat');
  assert.equal(activity.stimulus.surahNumber,112);
  assert.equal(activity.syntheticRecitationAllowed,false);
  assert.match(activity.mediaPath,/^\.\/assets\/recitation\/.*\.mp3$/);
  assert.match(activity.mediaSha256,/^[a-f0-9]{64}$/);
});
