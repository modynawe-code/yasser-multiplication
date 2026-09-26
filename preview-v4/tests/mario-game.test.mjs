import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gameRegistry } from '../src/modules/games/game-catalog.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Super Mario is registered as a local single-player game and lazy-loads its controller',async()=>{
  const game=gameRegistry.get('super-mario-bros');
  assert.equal(game?.title,'سوبر ماريو بروس');
  assert.deepEqual(game?.playModes,['solo']);
  assert.equal(game?.networkMode,'none');
  assert.ok(game?.load);
  const module=await game.load();
  assert.equal(typeof module.createMarioController,'function');
});

test('Mario screen loads its bundled ROM and provides touch and pause controls',async()=>{
  const shell=await read('src/modules/games/mario/mario-shell.js');
  const controller=await read('src/modules/games/mario/mario-controller.js');
  const css=await read('src/modules/games/mario/mario.css');
  assert.match(shell,/نسخة نينتندو الكلاسيكية/);
  assert.doesNotMatch(shell,/type="file"/);
  assert.match(shell,/data-mario-button="UP"/);
  assert.match(shell,/data-mario-button="A"/);
  assert.match(shell,/id="marioPause"/);
  assert.match(controller,/assets\/games\/super-mario-bros\.nes/);
  assert.match(controller,/0x4e.*0x45.*0x53.*0x1a/);
  assert.match(controller,/pointerdown/);
  assert.match(controller,/pointercancel/);
  assert.match(shell,/id="marioFullscreen"/);
  assert.match(controller,/document\.addEventListener\('keydown',onKeyDown\)/);
  assert.match(controller,/ArrowRight:'RIGHT'/);
  assert.match(controller,/requestFullscreen/);
  assert.match(css,/mario-immersive/);
  assert.match(css,/pointer-events:auto/);
  assert.match(controller,/\.destroy\(\)/);
  assert.match(css,/touch-action:none/);
  assert.match(css,/max-width:760px/);
});

test('offline app shell precaches the Mario game and its local emulator',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['src/modules/games/mario/mario-controller.js','src/modules/games/mario/mario-shell.js','src/modules/games/mario/mario.css','src/vendor/jsnes.min.js','src/vendor/JSNES-LICENSE.txt','assets/games/super-mario-bros.nes']){
    assert.ok(worker.includes(path),`${path} must be cached offline`);
    if(path.endsWith('.nes'))await readFile(new URL(`../${path}`,import.meta.url));else await read(path);
  }
  await import('../src/vendor/jsnes.min.js');
  assert.equal(typeof globalThis.jsnes?.Browser,'function');
  assert.equal(typeof globalThis.jsnes?.Controller?.BUTTON_A,'number');
  const rom=new Uint8Array(await readFile(new URL('../assets/games/super-mario-bros.nes',import.meta.url)));
  assert.deepEqual([...rom.slice(0,4)],[0x4e,0x45,0x53,0x1a]);
  let renderedFrames=0;
  const nes=new globalThis.jsnes.NES({emulateSound:false,onFrame:()=>renderedFrames++});
  nes.loadROM(rom);nes.frame();
  assert.equal(renderedFrames,1,'the bundled Mario ROM should render through one NES frame');
});
