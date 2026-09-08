import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalSkill, listMashaalSkills } from '../src/modules/mashaal/application/skill-index.js';

test('Mashaal skill index is domain aware',()=>{
  assert.ok(listMashaalSkills().length>0);
  assert.equal(getMashaalSkill('patterns')?.domainId,'cognitive-operations-general-knowledge');
});
