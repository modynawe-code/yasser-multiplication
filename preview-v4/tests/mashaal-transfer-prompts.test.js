import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_TRANSFER_PROMPTS } from '../src/modules/mashaal/application/transfer-prompts.js';

test('Mashaal supports learning transfer beyond the tablet',()=>{
  assert.ok(MASHAAL_TRANSFER_PROMPTS['count-and-quantity']?.length);
  assert.ok(MASHAAL_TRANSFER_PROMPTS['shapes-space']?.length);
});
