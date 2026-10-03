import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('RPS catalog advertises the shared online mode',async()=>{
  const source=await read('src/modules/games/game-catalog.js');
  assert.match(source,/id:'rock-paper-scissors'/);
  assert.match(source,/playModes:\['solo','local','online'\]/);
  assert.match(source,/availabilityLabel:'محلي \+ أونلاين'/);
});

test('RPS shell exposes local and online setup without duplicating the game view',async()=>{
  const source=await read('src/modules/games/rps/rps-shell.js');
  assert.match(source,/data-rps-mode="local"/);
  assert.match(source,/data-rps-mode="online"/);
  assert.match(source,/id="rpsCreateRoom"/);
  assert.match(source,/id="rpsJoinRoom"/);
  assert.match(source,/id="rpsRoomCodeInput"/);
  assert.match(source,/id="rpsOnlineWait"/);
});

test('RPS online UI uses the shared online session and keeps local play intact',async()=>{
  const source=await read('src/modules/games/rps/rps-controller.js');
  assert.match(source,/createRpsOnlineSession/);
  assert.match(source,/onlineSession\.create\(selectedOnlineLearner\)/);
  assert.match(source,/onlineSession\.join\(code,selectedOnlineLearner\)/);
  assert.match(source,/onlineSession\.choose\(choice\)/);
  assert.match(source,/onlineSession\.next\(\)/);
  assert.match(source,/onlineSession\.reset\(\)/);
  assert.match(source,/createRpsState\(\{players:\[\.\.\.selectedPlayers\],targetScore:3\}\)/);
});

test('RPS online progress events are emitted only for the learner on this device',async()=>{
  const controller=await read('src/modules/games/rps/rps-controller.js'),events=await read('src/modules/games/rps/rps-events.js');
  assert.match(controller,/gameEvents\.begin\(\[selfId\],\{sessionId:/);
  assert.match(controller,/learnerIds:\[selfId\]/);
  assert.match(events,/learnerIds=null/);
  assert.match(events,/session\.complete\(\{players,winner,learnerIds,participants/);
});
