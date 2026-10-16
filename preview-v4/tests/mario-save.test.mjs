import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {MARIO_SAVE_KEY,marioRomFingerprint,readMarioSave,writeMarioSave} from '../src/modules/games/mario/mario-save.js';
import '../src/vendor/jsnes.min.js';
const rom=new Uint8Array(await readFile(new URL('../assets/games/super-mario-bros.nes',import.meta.url)));
const romId=marioRomFingerprint(rom);
const newNes=()=>{const nes=new globalThis.jsnes.NES({emulateSound:false});nes.loadROM(rom);return nes;};
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test('Mario restores the real emulator state and produces the same subsequent frames',()=>{
  const nes=newNes(),saved=storage();
  // Start the game rather than testing only the attract/title screen.
  for(let i=0;i<90;i++)nes.frame();
  nes.buttonDown(1,globalThis.jsnes.Controller.BUTTON_START);nes.frame();nes.buttonUp(1,globalThis.jsnes.Controller.BUTTON_START);
  for(let i=0;i<180;i++)nes.frame();
  const before=nes.toJSON();const start=performance.now();
  assert.equal(writeMarioSave(saved,romId,nes,123456).ok,true);
  const duration=performance.now()-start;
  const result=readMarioSave(saved,romId);assert.equal(result.status,'ready');
  assert.equal(result.saved.savedAt,123456);assert.deepEqual(result.saved.state.cpu,before.cpu);
  const restored=newNes();restored.fromJSON(result.saved.state);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.toJSON().ppu)),result.saved.state.ppu);
  for(let i=0;i<30;i++){nes.frame();restored.frame();}
  assert.deepEqual(restored.toJSON().cpu,nes.toJSON().cpu);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.toJSON().ppu)),JSON.parse(JSON.stringify(nes.toJSON().ppu))); 
  console.log(`Mario snapshot: ${saved.getItem(MARIO_SAVE_KEY).length} bytes; serialization/write in memory: ${duration.toFixed(1)} ms`);
});

test('saving a held direction releases only the snapshot, not the live game',()=>{
  const nes=newNes(),saved=storage();nes.buttonDown(1,globalThis.jsnes.Controller.BUTTON_RIGHT);
  const before=nes.controllers[1].toJSON();writeMarioSave(saved,romId,nes);
  assert.deepEqual(nes.controllers[1].toJSON(),before);
  const restored=newNes();restored.fromJSON(readMarioSave(saved,romId).saved.state);
  assert.deepEqual(restored.controllers[1].state,Array(8).fill(0x40));
});

test('invalid, incompatible and inaccessible saves are handled without deleting data',()=>{
  const saved=storage();assert.equal(readMarioSave(saved,romId).status,'empty');
  saved.setItem(MARIO_SAVE_KEY,'broken');assert.equal(readMarioSave(saved,romId).status,'unavailable');assert.equal(saved.getItem(MARIO_SAVE_KEY),'broken');
  writeMarioSave(saved,romId,newNes());assert.equal(readMarioSave(saved,'different-rom').status,'incompatible');
  const record=JSON.parse(saved.getItem(MARIO_SAVE_KEY));record.state.cpu.mem=[];saved.setItem(MARIO_SAVE_KEY,JSON.stringify(record));assert.equal(readMarioSave(saved,romId).status,'invalid');
  assert.equal(readMarioSave({getItem(){throw new Error('blocked');}},romId).status,'unavailable');
});

test('quota failure preserves the previous good save and reports failure',()=>{
  const saved=storage();writeMarioSave(saved,romId,newNes());const original=saved.getItem(MARIO_SAVE_KEY);
  saved.setItem=()=>{throw new Error('QuotaExceededError');};
  assert.equal(writeMarioSave(saved,romId,newNes()).ok,false);assert.equal(saved.getItem(MARIO_SAVE_KEY),original);
});
