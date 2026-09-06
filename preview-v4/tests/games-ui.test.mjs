import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('games platform is composed as an isolated feature module',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/createGamesController/);
  assert.match(main,/createGameLearningAdapter/);
  assert.match(main,/learningAdapter:gameLearning/);
  assert.match(main,/games\.start\(\)/);
  assert.match(main,/games\?\.leave\(\)/);
});

test('games shell exposes games home and educational local XO without changing learner screens',async()=>{
  const shell=await read('src/modules/games/ui/games-shell.js');
  assert.match(shell,/gamesOpenBtn/);
  assert.match(shell,/id="gamesHomeView"/);
  assert.match(shell,/id="xoGameView"/);
  assert.match(shell,/class="xo-layout"/);
  assert.match(shell,/id="xoChallenge"/);
  assert.match(shell,/id="xoHearChallenge"/);
  assert.match(shell,/assets\/visual\/original\/yasser\/welcome\.png/);
  assert.match(shell,/assets\/visual\/original\/khaled\/khaled-point-thumbsup\.png/);
  assert.doesNotMatch(shell,/تُحفظ المحاولات التعليمية/);
});

test('XO controller depends on platform boundaries and native-aware shared audio, not learner controllers',async()=>{
  const controller=await read('src/modules/games/games-controller.js');
  assert.match(controller,/createPlayerContext/);
  assert.match(controller,/createXoState/);
  assert.match(controller,/passXoTurn/);
  assert.match(controller,/playXoMove/);
  assert.match(controller,/createSpeechService/);
  assert.match(controller,/learningAdapter\?\.recordChallenge/);
  assert.match(controller,/xo-game-mode/);
  assert.match(controller,/yasser\/celebrate\.png/);
  assert.match(controller,/khaled\/khaled-celebration\.png/);
  assert.match(controller,/xoPlayAgain/);
  assert.doesNotMatch(controller,/khaled-controller/);
  assert.doesNotMatch(controller,/app-controller/);
  assert.doesNotMatch(controller,/local-storage-repository/);
});

test('XO tablet landscape is one-screen and hides learner chrome',async()=>{
  const css=await read('src/modules/games/ui/games.css');
  assert.match(css,/body\.games-mode \.topbar\{display:none\}/);
  assert.match(css,/body\.xo-game-mode\{overflow:hidden\}/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/grid-template-columns:minmax\(340px/);
  assert.match(css,/\.xo-token\{width:82%;height:82%/);
});

test('PWA shell includes games platform and learning adapter modules',async()=>{
  const serviceWorker=await read('service-worker.js');
  assert.match(serviceWorker,/shell-44/);
  for(const path of [
    'src/modules/games/games-controller.js',
    'src/modules/games/learning/game-learning-providers.js',
    'src/modules/games/ui/games-shell.js',
    'src/modules/games/ui/games.css',
    'src/modules/games/xo/xo-engine.js'
  ])assert.ok(serviceWorker.includes(`./${path}`),`missing ${path}`);
});
