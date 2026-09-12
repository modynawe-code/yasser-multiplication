import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rpsChoiceGraphic, RPS_CHOICE_META } from '../src/modules/games/rps/rps-graphics.js';
import { RPS_AUDIO_CLIPS } from '../src/modules/games/rps/rps-audio.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('RPS uses the approved image assets for all three moves',()=>{
  const expected={
    rock:'assets/games/rps/rock.webp',
    paper:'assets/games/rps/paper.webp',
    scissors:'assets/games/rps/scissors.webp'
  };
  for(const choice of ['rock','paper','scissors']){
    assert.equal(RPS_CHOICE_META[choice]?.asset,expected[choice]);
    const markup=rpsChoiceGraphic(choice);
    assert.match(markup,/<img class="rps-choice-image"/);
    assert.match(markup,new RegExp(`src="${expected[choice].replaceAll('/','\\/')}"`));
    assert.doesNotMatch(markup,/<svg\b/);
  }
});

test('RPS shell renders custom move artwork and registry-hydrated player slots instead of child-specific markup',async()=>{
  const shell=await read('src/modules/games/rps/rps-shell.js');
  assert.match(shell,/rpsChoiceGraphic\('rock'\)/);
  assert.match(shell,/rpsChoiceGraphic\('paper'\)/);
  assert.match(shell,/rpsChoiceGraphic\('scissors'\)/);
  assert.doesNotMatch(shell,/>🪨</);
  assert.doesNotMatch(shell,/>📄</);
  assert.doesNotMatch(shell,/>✂️</);
  assert.match(shell,/id="rpsPlayerPicker"/);
  assert.match(shell,/id="rpsStartMatch"/);
  assert.match(shell,/data-rps-player-slot="0"/);
  assert.match(shell,/data-rps-player-slot="1"/);
  assert.match(shell,/id="rpsChangePlayers"/);
  assert.doesNotMatch(shell,/assets\/visual\/original\/(?:yasser|khaled)/);
  assert.doesNotMatch(shell,/rpsScoreCardYasser|rpsScoreCardKhaled/);
});

test('RPS controller derives every fun-game participant from the family registry and keeps generic two-player slots',async()=>{
  const controller=await read('src/modules/games/rps/rps-controller.js');
  const openFamilyCss=await read('src/modules/games/rps/rps-open-family.css');
  assert.match(controller,/listGameParticipants/);
  assert.match(controller,/getGameParticipant/);
  assert.match(controller,/gameParticipantMarkup/);
  assert.match(controller,/data-rps-player/);
  assert.match(controller,/createRpsState\(\{players:\[\.\.\.selectedPlayers\]/);
  assert.match(controller,/stage\.dataset\.player=player\.theme/);
  assert.match(controller,/rpsScoreCard\$\{suffix\}/);
  assert.doesNotMatch(controller,/const PLAYERS=/);
  assert.doesNotMatch(controller,/players:\s*\['yasser','khaled'\]/);
  assert.match(openFamilyCss,/rps-player-picker/);
  assert.match(openFamilyCss,/repeat\(auto-fit,minmax\(180px,1fr\)\)/);
  assert.match(openFamilyCss,/not\(\.yasser\):not\(\.khaled\)/);
});

test('RPS typography uses a modern offline-safe Arabic font stack',async()=>{
  const css=await read('src/modules/games/rps/rps.css');
  assert.match(css,/"Alexandria","Noto Sans Arabic","Segoe UI",Tahoma,Arial,sans-serif/);
  assert.match(css,/font-weight:800/);
  assert.doesNotMatch(css,/font-weight:950/);
});

test('RPS narration uses shared voice service with dynamic learner names while keeping optional approved clips',async()=>{
  const audio=await read('src/modules/games/rps/rps-audio.js');
  for(const key of ['turnYasser','turnKhaled','draw','pointYasser','pointKhaled','winYasser','winKhaled']){
    assert.ok(RPS_AUDIO_CLIPS[key]?.endsWith('.mp3'),`missing optional recorded clip path for ${key}`);
  }
  assert.match(audio,/createVoiceService/);
  assert.match(audio,/playerSay/);
  assert.match(audio,/games\.rps\.\$\{event\}\.\$\{player\.id\}/);
  assert.match(audio,/دور \$\{name\}/);
  assert.match(audio,/\$\{name\} أخذ نقطة/);
  assert.match(audio,/\$\{name\} بطل المباراة/);
  assert.doesNotMatch(audio,/playerId==='yasser'/);
  assert.match(audio,/playSfx/);
});

test('PWA shell caches RPS graphics, open-family presentation and shared natural voice modules',async()=>{
  const sw=await read('service-worker.js');
  assert.match(sw,/shell-\d+/);
  assert.match(sw,/src\/modules\/games\/rps\/rps-graphics\.js/);
  assert.match(sw,/src\/modules\/games\/rps\/rps-audio\.js/);
  assert.match(sw,/src\/modules\/games\/rps\/rps-open-family\.css/);
  assert.match(sw,/src\/shared\/audio\/human-voice-assets\.js/);
  assert.match(sw,/src\/shared\/audio\/human-voice-policy\.js/);
  assert.match(sw,/src\/shared\/audio\/natural-voice-profile\.js/);
  assert.match(sw,/src\/shared\/audio\/providers\/cloud-tts-provider\.js/);
  assert.match(sw,/src\/shared\/audio\/voice-service\.js/);
});
