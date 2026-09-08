import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectRuntimePlatform,systemBottomInsetPx } from '../src/shared/ui/system-insets.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('runtime platform detection distinguishes native Android from web',()=>{
  const android={getPlatform:()=> 'android',isNativePlatform:()=>true};
  const web={getPlatform:()=> 'web',isNativePlatform:()=>false};
  assert.deepEqual(detectRuntimePlatform(android),{native:true,platform:'android'});
  assert.deepEqual(detectRuntimePlatform(web),{native:false,platform:'web'});
});

test('system bottom inset keeps an Android large-screen taskbar floor and respects larger visual occlusion',()=>{
  const android={getPlatform:()=> 'android',isNativePlatform:()=>true};
  const normal={innerHeight:700,visualViewport:{offsetTop:0,height:700}};
  const occluded={innerHeight:700,visualViewport:{offsetTop:0,height:620}};
  assert.equal(systemBottomInsetPx(normal,android),56);
  assert.equal(systemBottomInsetPx(occluded,android),80);
});

test('web preview uses actual visual viewport occlusion without an invented native floor',()=>{
  const web={getPlatform:()=> 'web',isNativePlatform:()=>false};
  assert.equal(systemBottomInsetPx({innerHeight:700,visualViewport:{offsetTop:0,height:700}},web),0);
  assert.equal(systemBottomInsetPx({innerHeight:700,visualViewport:{offsetTop:0,height:676}},web),24);
});

test('RPS shell consumes the reusable system inset adapter instead of a screen-specific bottom margin',async()=>{
  const shell=await read('src/modules/games/rps/rps-shell.js');
  const css=await read('src/modules/games/rps/rps-open-family.css');
  const worker=await read('service-worker.js');
  assert.match(shell,/shared\/ui\/system-insets\.js/);
  assert.match(shell,/applySystemInsets\(view\.querySelector\('\.rps-shell'\)\)/);
  assert.match(css,/--app-system-safe-bottom/);
  assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
  assert.doesNotMatch(css,/margin-bottom:\s*56px/);
  assert.match(worker,/src\/shared\/ui\/system-insets\.js/);
});
