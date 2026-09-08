import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_DOMAIN_ORDER } from '../src/modules/mashaal/data/kg3-domain-order.js';

test('Mashaal KG3 child-facing order covers all six domains once',()=>{
  assert.equal(MASHAAL_KG3_DOMAIN_ORDER.length,6);
  assert.equal(new Set(MASHAAL_KG3_DOMAIN_ORDER).size,6);
});
