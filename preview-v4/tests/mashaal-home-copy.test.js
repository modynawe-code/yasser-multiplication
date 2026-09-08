import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_HOME_COPY } from '../src/modules/mashaal/ui/home-copy.js';

test('Mashaal home copy stays short and child oriented',()=>{
  assert.equal(MASHAAL_HOME_COPY.title,'نلعب ونتعلم');
  assert.ok(MASHAAL_HOME_COPY.subtitle.length<40);
});
