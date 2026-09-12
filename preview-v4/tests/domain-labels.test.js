import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_CHILD_DOMAIN_LABELS } from '../src/modules/mashaal/data/domain-labels.js';

test('Mashaal exposes one child-friendly label per KG3 domain',()=>{
  assert.equal(Object.keys(MASHAAL_CHILD_DOMAIN_LABELS).length,6);
  assert.equal(MASHAAL_CHILD_DOMAIN_LABELS['language-communication'],'حروفي وكلامي');
});
