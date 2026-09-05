import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, normalizeEmail, randomSessionToken, sha256Base64Url, validatePassword, verifyPassword } from '../src/security.mjs';

test('password hashing is salted and verifies without storing plaintext',async()=>{
  const first=await hashPassword('A-strong-family-passphrase');
  const second=await hashPassword('A-strong-family-passphrase');
  assert.notEqual(first.salt,second.salt);
  assert.notEqual(first.hash,second.hash);
  assert.equal(await verifyPassword('A-strong-family-passphrase',first),true);
  assert.equal(await verifyPassword('wrong-password-value',first),false);
  assert.ok(first.iterations>=200000);
});

test('session tokens are high entropy and stored through a one-way hash',async()=>{
  const a=randomSessionToken(),b=randomSessionToken();
  assert.notEqual(a,b);
  assert.ok(a.length>=40);
  assert.notEqual(await sha256Base64Url(a),a);
});

test('credential input normalization rejects weak passwords',()=>{
  assert.equal(normalizeEmail('  Parent@Example.COM '),'parent@example.com');
  assert.equal(validatePassword('short'),false);
  assert.equal(validatePassword('long-enough-family-password'),true);
});
