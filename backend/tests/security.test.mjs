import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, normalizeEmail, randomSessionToken, sha256Base64Url, validatePassword, verifyPassword } from '../src/security.mjs';

test('parent PIN hashing is salted and verifies without storing plaintext',async()=>{
  const first=await hashPassword('482731');
  const second=await hashPassword('482731');
  assert.notEqual(first.salt,second.salt);
  assert.notEqual(first.hash,second.hash);
  assert.equal(await verifyPassword('482731',first),true);
  assert.equal(await verifyPassword('111111',first),false);
  assert.ok(first.iterations>=200000);
});

test('session tokens are high entropy and stored through a one-way hash',async()=>{
  const a=randomSessionToken(),b=randomSessionToken();
  assert.notEqual(a,b);
  assert.ok(a.length>=40);
  assert.notEqual(await sha256Base64Url(a),a);
});

test('credential input normalization accepts exactly six numeric PIN digits',()=>{
  assert.equal(normalizeEmail('  Parent@Example.COM '),'parent@example.com');
  assert.equal(validatePassword('482731'),true);
  assert.equal(validatePassword('48273'),false);
  assert.equal(validatePassword('4827310'),false);
  assert.equal(validatePassword('48A731'),false);
});
