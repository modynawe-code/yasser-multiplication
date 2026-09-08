import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_TRANSFER_PROMPTS,getMashaalTransferPrompt } from '../src/modules/mashaal/application/transfer-prompts.js';

const READY_SKILLS=Object.freeze([
  'listen-follow-simple-directions','oral-vocabulary-expression','story-sequencing','sound-awareness','letter-sound-readiness','prewriting-fine-motor',
  'count-and-quantity','compare-quantities','classify-sort','patterns','shapes-space','observe-reason',
  'recognize-emotions','express-needs-feelings','turn-taking-sharing','seek-help-self-regulation',
  'healthy-habits','personal-safety','gross-motor','fine-motor'
]);

test('every ready KG3 skill transfers learning beyond the tablet',()=>{
  for(const skillId of READY_SKILLS){assert.ok(MASHAAL_TRANSFER_PROMPTS[skillId]?.length,skillId);assert.ok(getMashaalTransferPrompt(skillId).length>0,skillId);}
});

test('unknown skills fail closed without inventing a transfer task',()=>{assert.equal(getMashaalTransferPrompt('not-a-real-skill'),'');});
