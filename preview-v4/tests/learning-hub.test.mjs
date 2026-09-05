import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('main bootstraps hub without replacing Yasser controller',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/createAppController/);
  assert.match(main,/createHubController/);
  assert.match(main,/createKhaledController/);
  assert.match(main,/ensureLearningShell/);
});

test('hub exposes two learner routes and keeps Khaled images decoupled',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  assert.match(shell,/id="hubYasser"/);
  assert.match(shell,/id="hubKhaled"/);
  assert.match(shell,/جدول الضرب 1–10/);
  assert.match(shell,/رياضيات أول ابتدائي/);
  assert.match(shell,/عد • مقارنة • أنماط • أعداد/);
  assert.doesNotMatch(shell,/assets\/.*khaled.*\.(png|webp)/i);
  assert.doesNotMatch(shell,/صور خالد ستضاف لاحقًا/);
});

test('switching learners closes active module state and leaves one active view',async()=>{
  const main=await read('src/main.js');
  const hub=await read('src/modules/hub/hub-controller.js');
  const yasser=await read('src/ui/app-controller.js');
  assert.match(hub,/onBeforeShow\?\.\(\)/);
  assert.match(main,/onBeforeShow:\(\)=>/);
  assert.match(main,/yasser\.leave\(\)/);
  assert.match(main,/khaled\.leave\(\)/);
  assert.match(main,/classList\.remove\('hub-mode','khaled-mode'\)/);
  assert.match(yasser,/all\('\.view'\)\.forEach/);
  assert.match(yasser,/session\.completed=true/);
  assert.match(yasser,/enterHome:goHome/);
  assert.match(yasser,/\n    leave,/);
});

test('Khaled mode hides Yasser chrome and preserves incomplete sessions',async()=>{
  const css=await read('src/modules/hub/learning-hub.css');
  const khaled=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(css,/body\.khaled-mode \.topbar/);
  assert.match(khaled,/classList\.add\('khaled-mode'\)/);
  assert.match(khaled,/classList\.remove\('khaled-mode'\)/);
  assert.match(khaled,/session\.completed=true/);
  assert.match(khaled,/storeSession\(\{incomplete:true\}\)/);
});

test('offline shell includes hub, Khaled and speech modules',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/hub/hub-controller.js','modules/hub/learning-shell.js','modules/hub/learning-hub.css','modules/khaled/domain/curriculum.js','modules/khaled/ui/khaled-controller.js','shared/audio/speech-service.js']){
    assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
