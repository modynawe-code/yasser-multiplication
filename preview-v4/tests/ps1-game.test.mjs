import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gameRegistry } from '../src/modules/games/game-catalog.js';
import { readPs1GamepadInputs } from '../src/modules/games/ps1/ps1-gamepad.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('PS1 is a separate lazy-loaded game in the shared games catalog',async()=>{
  const game=gameRegistry.get('playstation-ps1');
  assert.equal(game?.title,'ألعاب PlayStation 1');
  assert.deepEqual(game?.playModes,['solo']);
  assert.equal(game?.networkMode,'none');
  const module=await game.load();
  assert.equal(typeof module.createPs1Controller,'function');
});

test('PS1 player loads a pinned EmulatorJS release using device-selected files',async()=>{
  const controller=await read('src/modules/games/ps1/ps1-controller.js');
  const shell=await read('src/modules/games/ps1/ps1-shell.js');
  const css=await read('src/modules/games/ps1/ps1.css');
  assert.match(controller,/cdn\.emulatorjs\.org\/4\.2\.3\/data\//);
  assert.match(controller,/EJS_core:'pcsx_rearmed'/);
  assert.match(controller,/EJS_gameUrl:rom,EJS_biosUrl:bios/);
  assert.match(controller,/new Set\(\['chd','pbp','iso','bin','cue','zip'\]\)/);
  assert.match(shell,/id="ps1RomFile" type="file"/);
  assert.match(shell,/EBOOT\.PBP يعمل عبر محاكي PS1/);
  assert.match(shell,/id="ps1BiosFile" type="file"/);
  assert.match(shell,/id="ps1Fullscreen"/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/aspect-ratio:4\/3/);
  assert.match(controller,/EJS_terminate\?\./);
});

test('PS1 gamepad profile maps standard PlayStation controls and sticks',()=>{
  const buttons=Array.from({length:16},()=>({pressed:false,value:0}));
  for(const index of [0,1,2,3,4,5,6,7,8,9,12,13,14,15])buttons[index]={pressed:true,value:1};
  const pad={connected:true,mapping:'standard',buttons,axes:[-0.8,0.8,0.6,-0.9]};
  assert.deepEqual(readPs1GamepadInputs(pad),[
    'CROSS','CIRCLE','SQUARE','TRIANGLE','L1','R1','L2','R2','SELECT','START','UP','DOWN','LEFT','RIGHT',
    'LEFT_STICK_LEFT','LEFT_STICK_DOWN','RIGHT_STICK_RIGHT','RIGHT_STICK_UP'
  ]);
});

test('PS1 player files are included in the app shell cache',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['src/modules/games/ps1/ps1-controller.js','src/modules/games/ps1/ps1-shell.js','src/modules/games/ps1/ps1.css?v=psx-pbp-2','src/modules/games/ps1/ps1-gamepad.js']){
    assert.ok(worker.includes(path),`${path} must be available from the app shell cache`);
    await read(path.split('?')[0]);
  }
  assert.match(worker,/shell-134/);
});
