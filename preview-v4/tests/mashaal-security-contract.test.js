import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_SECURITY_CONTRACT } from '../src/modules/mashaal/security-contract.js';

test('Mashaal respects existing family trust boundary',()=>{
  assert.equal(MASHAAL_SECURITY_CONTRACT.parentOnlyCloudOperations,true);
  assert.equal(MASHAAL_SECURITY_CONTRACT.noSecretsInFrontend,true);
  assert.equal(MASHAAL_SECURITY_CONTRACT.learnerScopedData,true);
});
