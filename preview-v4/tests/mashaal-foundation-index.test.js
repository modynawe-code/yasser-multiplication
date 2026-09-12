import test from 'node:test';
import assert from 'node:assert/strict';
import * as mashaal from '../src/modules/mashaal/index.foundation.js';

test('Mashaal foundation preserves layered module boundaries',()=>{
  assert.ok(mashaal.Curriculum);
  assert.ok(mashaal.Domain);
  assert.ok(mashaal.Application);
  assert.ok(mashaal.Infrastructure);
  assert.ok(mashaal.UI);
});
