import test from 'node:test';
import assert from 'node:assert/strict';
import * as ui from '../src/modules/mashaal/ui/index.js';

test('Mashaal UI API exposes KG3 home model and contracts',()=>{
  assert.equal(typeof ui.getMashaalHomeDomains,'function');
  assert.equal(ui.MASHAAL_UI_CONTRACT.instructionMode,'audio-first');
});
