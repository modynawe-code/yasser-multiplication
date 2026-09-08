import test from 'node:test';
import assert from 'node:assert/strict';
import { getLearnerProfile, isRegisteredLearner, listLearnerProfiles } from '../src/shared/learners/learner-registry.js';
import { getCurriculum } from '../src/shared/curricula/curriculum-registry.js';
import { MASHAAL_KG3_DOMAINS, MASHAAL_KG3_FOUNDATION } from '../src/modules/mashaal/curriculum/kg3-curriculum.js';
import { MASHAAL_KG3_SKILL_MAP } from '../src/modules/mashaal/curriculum/kg3-skill-map.js';

test('learner registry exposes independent Yasser, Khaled and Mashaal profiles',()=>{
  assert.deepEqual(listLearnerProfiles().map(item=>item.id),['yasser','khaled','mashaal']);
  assert.equal(getLearnerProfile('mashaal')?.stage,'kg3');
  assert.equal(isRegisteredLearner('future-child'),false);
});

test('Mashaal is linked to Saudi KG3 curriculum with six official domains',()=>{
  const curriculum=getCurriculum('saudi-kg3');
  assert.ok(curriculum);
  assert.equal(curriculum.ageRange,'5-6');
  assert.equal(curriculum.domains.length,6);
  assert.equal(MASHAAL_KG3_DOMAINS.length,6);
  assert.equal(MASHAAL_KG3_FOUNDATION.curriculumId,'saudi-kg3');
  for(const domain of MASHAAL_KG3_DOMAINS){
    assert.ok(Array.isArray(MASHAAL_KG3_SKILL_MAP[domain.id]));
    assert.ok(MASHAAL_KG3_SKILL_MAP[domain.id].length>0);
  }
});
