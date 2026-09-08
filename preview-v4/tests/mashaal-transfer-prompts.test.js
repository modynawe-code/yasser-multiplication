import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_TRANSFER_PROMPTS,getMashaalTransferPrompt } from '../src/modules/mashaal/application/transfer-prompts.js';

const CORE_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason'
]);

test('every language and cognitive KG3 core skill transfers learning beyond the tablet',()=>{
  for(const skillId of CORE_SKILLS){
    assert.ok(MASHAAL_TRANSFER_PROMPTS[skillId]?.length,skillId);
    assert.ok(getMashaalTransferPrompt(skillId).length>0,skillId);
  }
});

test('unknown skills fail closed without inventing a transfer task',()=>{
  assert.equal(getMashaalTransferPrompt('not-a-real-skill'),'');
});
