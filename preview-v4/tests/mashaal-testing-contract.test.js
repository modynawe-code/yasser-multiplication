import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_TESTING_CONTRACT } from '../src/modules/mashaal/testing-contract.js';

test('Mashaal cannot merge without Yasser and Khaled regression coverage',()=>{
  assert.equal(MASHAAL_TESTING_CONTRACT.regressionYasser,true);
  assert.equal(MASHAAL_TESTING_CONTRACT.regressionKhaled,true);
  assert.equal(MASHAAL_TESTING_CONTRACT.offlinePwa,true);
});
