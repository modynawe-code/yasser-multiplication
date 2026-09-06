import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('games platform is composed as an isolated feature module',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/createGamesController/);
  assert.match(main,/games\.start\(\)/);
  assert.match(main,/games\?\.leave\(\)/);
});

test('games shell exposes games home and local XO without changing learner screens',async()=>{
  const shell=await read('src/modules/games/ui/games-shell.js');
  assert.match(shell,/id="gamesOpenBtn"/);
  assert.match(shell,/id="gamesHomeView"/);
  assert.match(shell,/id="xoGameView"/);
  assert.match(shell,/assets\/visual\/original\/yasser\/welcome\.png/);
  assert.match(shell,/assets\/visual\/original\/khaled\/khaled-point-thumbsup\.png/);
});

test('local XO controller depends on player context and pure XO engine, not learner controllers',async()=>{
  const controller=await read('src/modules/games/games-controller.js');
  assert.match(controller,/createPlayerContext/);
  assert.match(controller,/createXoState/);
  assert.match(controller,/playXoMove/);
  assert.doesNotMatch(controller,/khaled-controller/);
  assert.doesNotMatch(controller,/app-controller/);
  assert.doesNotMatch(controller,/local-storage-repository/);
});

test('PWA shell includes games platform modules',async()=>{
  const serviceWorker=await read('service-worker.js');
  assert.match(serviceWorker,/shell-43/);
  for(const path of [
    'src/modules/games/games-controller.js',
    'src/modules/games/ui/games-shell.js',
    'src/modules/games/ui/games.css',
    'src/modules/games/xo/xo-engine.js'
  ])assert.ok(serviceWorker.includes(`./${path}`),`missing ${path}`);
});
