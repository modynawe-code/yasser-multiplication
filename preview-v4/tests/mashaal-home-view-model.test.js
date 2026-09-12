import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalHomeDomains } from '../src/modules/mashaal/ui/home-view-model.js';

test('Mashaal home presents six child-friendly KG3 worlds',()=>{
  const domains=getMashaalHomeDomains();
  assert.equal(domains.length,6);
  assert.equal(domains[0].title,'حروفي وكلامي');
  assert.equal(domains[1].title,'أفكر وأكتشف');
});
