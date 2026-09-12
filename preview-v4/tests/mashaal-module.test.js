import test from 'node:test';
import assert from 'node:assert/strict';
import * as mashaal from '../src/modules/mashaal/index.js';

test('Mashaal module exposes KG3 curriculum contracts',()=>{
  assert.equal(mashaal.MASHAAL_KG3_FOUNDATION.stage,'kg3');
  assert.equal(mashaal.MASHAAL_KG3_DOMAINS.length,6);
});
