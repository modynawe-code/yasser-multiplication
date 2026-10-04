import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveFamilyCredentials,formatFamilyCode,generateFamilyCode,isValidFamilyCode,normalizeFamilyCode } from '../src/shared/family/family-code-credentials.js';

test('family code is high entropy, normalized and human readable',()=>{
  const code=generateFamilyCode(globalThis.crypto);
  assert.equal(code.length,6);
  assert.equal(isValidFamilyCode(code),true);
  assert.equal(normalizeFamilyCode(formatFamilyCode(code)),code);
  assert.match(formatFamilyCode(code),/^[A-Z2-9]{6}$/);
});

test('same family code always derives the same private account credentials',async()=>{
  const code='AB2CD3';
  const first=await deriveFamilyCredentials(code);
  const second=await deriveFamilyCredentials('ab2cd3');
  assert.deepEqual(first,second);
  assert.match(first.email,/^family-[a-f0-9]{24}@family\.invalid$/);
  assert.ok(first.password.length>10);
  assert.doesNotMatch(first.email,/AB2CD3/i);
  assert.doesNotMatch(first.password,/AB2CD3/i);
});

test('invalid short family code is rejected',async()=>{
  await assert.rejects(()=>deriveFamilyCredentials('12345'),/invalid_family_code/);
});
