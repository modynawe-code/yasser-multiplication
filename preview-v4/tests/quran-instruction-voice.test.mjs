import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuranInstructionVoice} from '../src/shared/quran/quran-instruction-voice.js';

test('non-Quran child instructions are optional and cannot replace human recitation',async()=>{
  const recorded=[],env={
    SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
    speechSynthesis:{speak:utterance=>recorded.push(utterance),cancel:()=>recorded.push('cancel')}
  };
  const helper=createQuranInstructionVoice({environment:env});
  assert.equal(helper.available(),true);
  assert.equal(helper.speak('اضغط ابدأ الاستماع'),true);
  assert.equal(recorded.at(-1).text,'اضغط ابدأ الاستماع');
  assert.equal(recorded.at(-1).lang,'ar-SA');
  assert.equal(helper.speak('x'.repeat(200)),false);
  assert.equal(createQuranInstructionVoice({environment:{}}).available(),false);
  const player=await readFile(new URL('../src/modules/mashaal/quran/quran-surah-player.js',import.meta.url),'utf8');
  assert.doesNotMatch(player,/speechSynthesis|SpeechSynthesisUtterance|createSpeechService/);
  assert.match(player,/new Audio\(audioPath\)/);
  assert.match(player,/stopInstructionVoice\(\);await audio\.play\(\)/);
});
