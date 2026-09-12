import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_UI_CONTRACT } from '../src/modules/mashaal/ui/ui-contract.js';

test('Mashaal child UI stays audio-first and avoids score pressure',()=>{
  assert.equal(MASHAAL_UI_CONTRACT.instructionMode,'audio-first');
  assert.equal(MASHAAL_UI_CONTRACT.childFacingPercentages,false);
  assert.equal(MASHAAL_UI_CONTRACT.childFacingWrongCount,false);
  assert.equal(MASHAAL_UI_CONTRACT.touchFirst,true);
});
