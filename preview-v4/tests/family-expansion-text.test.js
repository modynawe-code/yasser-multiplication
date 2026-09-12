import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_EXPANSION_INVARIANT } from '../src/shared/family/expansion-invariant.js';

test('family expansion invariant remains explicit',()=>{
  assert.match(FAMILY_EXPANSION_INVARIANT,/must not require editing existing learner feature modules/);
});
