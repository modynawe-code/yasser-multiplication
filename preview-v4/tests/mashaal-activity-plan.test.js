import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';

const CORE_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason'
]);

test('Mashaal activity plan composes skill metadata and verified catalog content',()=>{
  const plan=createMashaalActivityPlan('patterns');
  assert.equal(plan.learnerId,'mashaal');
  assert.equal(plan.domainId,'cognitive-operations-general-knowledge');
  assert.ok(plan.activityTypes.includes('sequencing'));
  assert.deepEqual(plan.sequence,['listen','look','choose-or-manipulate','feedback','transfer']);
  assert.equal(plan.contentReady,true);
  assert.equal(plan.activities.length,1);
  assert.equal(plan.activities[0].id,'kg3-pattern-01');
});

test('all language and cognitive KG3 core skills have verified starter activity content',()=>{
  for(const skillId of CORE_SKILLS){
    const plan=createMashaalActivityPlan(skillId);
    assert.equal(plan.contentReady,true,skillId);
    assert.ok(plan.activities.length>=1,skillId);
  }
});

test('a later-domain skill stays closed until its own verified activity content exists',()=>{
  const plan=createMashaalActivityPlan('recognize-emotions');
  assert.equal(plan.contentReady,false);
  assert.deepEqual(plan.activities,[]);
});
