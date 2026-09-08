import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';

const READY_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason',
  'recognize-emotions','express-needs-feelings','turn-taking-sharing','seek-help-self-regulation',
  'healthy-habits','personal-safety','gross-motor','fine-motor'
]);

test('Mashaal activity plan composes skill metadata and verified catalog content',()=>{
  const plan=createMashaalActivityPlan('patterns');
  assert.equal(plan.learnerId,'mashaal');assert.equal(plan.domainId,'cognitive-operations-general-knowledge');
  assert.ok(plan.activityTypes.includes('sequencing'));
  assert.deepEqual(plan.sequence,['listen','look','choose-or-manipulate','feedback','transfer']);
  assert.equal(plan.contentReady,true);assert.equal(plan.activities.length,1);assert.equal(plan.activities[0].id,'kg3-pattern-01');
});

test('language cognitive social-emotional and health KG3 skills have verified starter activity content',()=>{
  for(const skillId of READY_SKILLS){const plan=createMashaalActivityPlan(skillId);assert.equal(plan.contentReady,true,skillId);assert.ok(plan.activities.length>=1,skillId);}
});

test('Islamic and national detail stays closed until its activity content is separately reviewed',()=>{
  for(const skillId of ['listen-repeat','islamic-values-situations','family-community','saudi-identity-belonging','places-roles']){
    const plan=createMashaalActivityPlan(skillId);assert.equal(plan.contentReady,false,skillId);assert.deepEqual(plan.activities,[]);
  }
});
