import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('family word categories exposes local and multi-device online modes',async()=>{
  const catalog=await read('src/modules/games/game-catalog.js');
  const controller=await read('src/modules/games/categories/categories-controller.js');
  const online=await read('src/modules/games/categories/categories-online-controller.js');
  assert.match(catalog,/playModes:\['local','online'\]/);
  assert.match(catalog,/networkMode:'simultaneous'/);
  assert.match(controller,/data-fwc-mode="online"/);
  assert.match(controller,/categories-online-controller\.js/);
  assert.match(online,/gameId:'family-word-categories'/);
  assert.match(online,/session\.submit\('submit'/);
  assert.match(online,/session\.submit\('judge'/);
});


test('multi-device countdown corrects local device time against the server clock',async()=>{
  const online=await read('src/modules/games/categories/categories-online-controller.js');
  assert.match(online,/serverNow/);
  assert.match(online,/clockOffset/);
  assert.match(online,/Date\.now\(\)\+clockOffset/);
});


test('local pass-and-play and online room mode are separate interaction systems',async()=>{
  const local=await read('src/modules/games/categories/categories-controller.js');
  const online=await read('src/modules/games/categories/categories-online-controller.js');
  assert.match(local,/id="fwcHandoff"/);
  assert.match(local,/turnStartedAt/);
  assert.match(local,/function beginTurn/);
  assert.match(local,/function finishActiveTurn/);
  assert.doesNotMatch(local,/function switchPlayer/);
  assert.match(local,/سلّم الجهاز للاعب التالي/);
  assert.match(online,/إنشاء غرفة/);
  assert.match(online,/رمز الغرفة/);
  assert.match(online,/pollIntervalMs:800/);
});


test('online controller module imports successfully',async()=>{
  const module=await import('../src/modules/games/categories/categories-online-controller.js');
  assert.equal(typeof module.createCategoriesOnlineController,'function');
});


test('word game does not keep a second permanent device history',async()=>{
  const local=await read('src/modules/games/categories/categories-controller.js');
  const online=await read('src/modules/games/categories/categories-online-controller.js');
  assert.doesNotMatch(local,/family-word-categories-history-v1/);
  assert.doesNotMatch(online,/family-word-categories-history-v1/);
  assert.match(local,/gameHistoryService\.recordGameResult/);
});
