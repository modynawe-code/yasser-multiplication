import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_SKILL_MAP } from '../src/modules/mashaal/curriculum/kg3-skill-map.js';
import { MASHAAL_SOURCE_REGISTRY } from '../src/modules/mashaal/curriculum/source-registry.js';
import { MASHAAL_KG3_SKILL_PROVENANCE,summarizeMashaalKg3Provenance } from '../src/modules/mashaal/curriculum/kg3-skill-provenance.js';

test('every Mashaal KG3 implementation skill has explicit provenance',()=>{
  const skillIds=Object.values(MASHAAL_KG3_SKILL_MAP).flat().map(skill=>skill.id);
  assert.equal(skillIds.length,25);
  assert.deepEqual(new Set(Object.keys(MASHAAL_KG3_SKILL_PROVENANCE)),new Set(skillIds));
  for(const skillId of skillIds){
    const evidence=MASHAAL_KG3_SKILL_PROVENANCE[skillId];
    assert.ok(evidence,skillId);
    assert.ok(MASHAAL_SOURCE_REGISTRY[evidence.sourceId],`${skillId}: unknown source ${evidence.sourceId}`);
  }
});

test('curriculum verification remains conservative until pending indicators are resolved',()=>{
  const summary=summarizeMashaalKg3Provenance();
  assert.deepEqual(summary,{
    total:25,
    'direct-indicator':2,
    'standards-strand':11,
    'adult-strategy':3,
    'pending-indicator':9
  });
  assert.ok(summary['pending-indicator']>0);
});
