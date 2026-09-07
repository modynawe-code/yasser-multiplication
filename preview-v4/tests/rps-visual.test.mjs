import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rpsChoiceGraphic } from '../src/modules/games/rps/rps-graphics.js';
import { RPS_AUDIO_CLIPS } from '../src/modules/games/rps/rps-audio.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('RPS uses custom cohesive SVG graphics for all three moves',()=>{
  for(const choice of ['rock','paper','scissors']){
    const markup=rpsChoiceGraphic(choice);
    assert.match(markup,/<svg class="rps-choice-svg"/);
  }
  assert.match(rpsChoiceGraphic('rock'),/rps-rock-body/);
  assert.match(rpsChoiceGraphic('paper'),/rps-paper-body/);
  assert.match(rpsChoiceGraphic('scissors'),/rps-scissors-ring/);
});

test('RPS shell renders custom move artwork instead of emoji placeholders',async()=>{
  const shell=await read('src/modules/games/rps/rps-shell.js');
  assert.match(shell,/rpsChoiceGraphic\('rock'\)/);
  assert.match(shell,/rpsChoiceGraphic\('paper'\)/);
  assert.match(shell,/rpsChoiceGraphic\('scissors'\)/);
  assert.doesNotMatch(shell,/>🪨</);
  assert.doesNotMatch(shell,/>📄</);
  assert.doesNotMatch(shell,/>✂️</);
});

test('RPS turn frame and active score card follow the current learner theme',async()=>{
  const controller=await read('src/modules/games/rps/rps-controller.js');
  const css=await read('src/modules/games/rps/rps.css');
  assert.match(controller,/stage\.dataset\.player=playerId/);
  assert.match(controller,/rpsScoreCardYasser/);
  assert.match(controller,/rpsScoreCardKhaled/);
  assert.match(css,/\.rps-stage\[data-player="yasser"\]/);
  assert.match(css,/\.rps-stage\[data-player="khaled"\]/);
  assert.match(css,/\.rps-score-card\.yasser\.current/);
  assert.match(css,/\.rps-score-card\.khaled\.current/);
});

test('RPS typography uses a modern offline-safe Arabic font stack',async()=>{
  const css=await read('src/modules/games/rps/rps.css');
  assert.match(css,/"Alexandria","Noto Sans Arabic","Segoe UI",Tahoma,Arial,sans-serif/);
  assert.match(css,/font-weight:800/);
  assert.doesNotMatch(css,/font-weight:950/);
});

test('RPS narration uses shared voice service while gameplay SFX stay independent',async()=>{
  const audio=await read('src/modules/games/rps/rps-audio.js');
  for(const key of ['turnYasser','turnKhaled','draw','pointYasser','pointKhaled','winYasser','winKhaled']){
    assert.ok(RPS_AUDIO_CLIPS[key]?.endsWith('.mp3'),`missing optional recorded clip path for ${key}`);
  }
  assert.match(audio,/createVoiceService/);
  assert.match(audio,/games\.rps\.turn\.yasser/);
  assert.match(audio,/games\.rps\.win\.khaled/);
  assert.match(audio,/playSfx/);
});

test('PWA shell caches RPS graphics and shared natural voice modules',async()=>{
  const sw=await read('service-worker.js');
  assert.match(sw,/shell-\d+/);
  assert.match(sw,/src\/modules\/games\/rps\/rps-graphics\.js/);
  assert.match(sw,/src\/modules\/games\/rps\/rps-audio\.js/);
  assert.match(sw,/src\/shared\/audio\/human-voice-assets\.js/);
  assert.match(sw,/src\/shared\/audio\/human-voice-policy\.js/);
  assert.match(sw,/src\/shared\/audio\/natural-voice-profile\.js/);
  assert.match(sw,/src\/shared\/audio\/providers\/cloud-tts-provider\.js/);
  assert.match(sw,/src\/shared\/audio\/voice-service\.js/);
});
