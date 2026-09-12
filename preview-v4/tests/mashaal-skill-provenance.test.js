import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_SKILL_MAP } from '../src/modules/mashaal/curriculum/kg3-skill-map.js';
import { MASHAAL_SOURCE_REGISTRY } from '../src/modules/mashaal/curriculum/source-registry.js';
import { MASHAAL_KG3_SKILL_PROVENANCE,MASHAAL_KG3_SOURCE_POLICY,summarizeMashaalKg3Provenance } from '../src/modules/mashaal/curriculum/kg3-skill-provenance.js';

test('every Mashaal KG3 implementation skill has direct standards provenance',()=>{
  const skillIds=Object.values(MASHAAL_KG3_SKILL_MAP).flat().map(skill=>skill.id);
  assert.equal(skillIds.length,25);
  assert.deepEqual(new Set(Object.keys(MASHAAL_KG3_SKILL_PROVENANCE)),new Set(skillIds));
  for(const skillId of skillIds){
    const evidence=MASHAAL_KG3_SKILL_PROVENANCE[skillId];
    assert.ok(evidence,skillId);
    assert.equal(evidence.status,MASHAAL_KG3_SOURCE_POLICY.requiredSkillStatus,skillId);
    assert.ok(MASHAAL_SOURCE_REGISTRY[evidence.sourceId],`${skillId}: unknown source ${evidence.sourceId}`);
    assert.ok(evidence.indicator.length>0,`${skillId}: missing indicator`);
  }
});

test('all current KG3 implementation skills are mapped to direct SELS indicators',()=>{
  assert.deepEqual(summarizeMashaalKg3Provenance(),{
    total:25,
    'direct-indicator':25
  });
  assert.equal(MASHAAL_KG3_SOURCE_POLICY.activityReleaseRequiresSourceBinding,true);
});
