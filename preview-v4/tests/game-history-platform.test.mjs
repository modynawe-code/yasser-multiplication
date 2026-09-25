import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('current local competitive games publish results through one history service',async()=>{
  const [games,rps,words]=await Promise.all([
    read('src/modules/games/games-controller.js'),
    read('src/modules/games/rps/rps-controller.js'),
    read('src/modules/games/categories/categories-controller.js')
  ]);
  assert.match(games,/gameHistoryService\.recordGameResult/);
  assert.match(games,/gameId:'xo'/);
  assert.match(rps,/gameHistoryService\.recordGameResult/);
  assert.match(rps,/gameId:'rock-paper-scissors'/);
  assert.match(words,/gameHistoryService\.recordGameResult/);
  assert.match(words,/gameId:'family-word-categories'/);
});

test('games area exposes one server-backed family history UI',async()=>{
  const [shell,controller]=await Promise.all([
    read('src/modules/games/ui/games-shell.js'),
    read('src/modules/games/games-controller.js')
  ]);
  assert.match(shell,/id="gamesHistoryView"/);
  assert.match(shell,/id="gamesHistoryStats"/);
  assert.match(shell,/id="gamesHistoryList"/);
  assert.match(controller,/gameHistoryService\.getHistory/);
  assert.match(controller,/gameHistoryService\.getStats/);
  assert.match(controller,/الفوز 3/);
});

test('PWA caches the shared history client',async()=>{
  const sw=await read('service-worker.js');
  assert.match(sw,/games\/history\/game-history-service\.js/);
});
