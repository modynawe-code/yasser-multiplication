import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_ACCESSIBILITY_CONTRACT } from '../src/modules/mashaal/ui/accessibility-contract.js';

test('Mashaal KG3 UI requires spoken instructions and non-color-only meaning',()=>{
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.spokenInstructions,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.noColorOnlyMeaning,true);
  assert.equal(MASHAAL_ACCESSIBILITY_CONTRACT.largeTouchTargets,true);
});
