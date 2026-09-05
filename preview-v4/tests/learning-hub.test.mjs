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
  assert.doesNotMatch(shell,/assets\/.*khaled.*\.(png|webp)/i);
});

test('offline shell includes hub, Khaled and speech modules',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/hub/hub-controller.js','modules/hub/learning-shell.js','modules/hub/learning-hub.css','modules/khaled/domain/curriculum.js','modules/khaled/ui/khaled-controller.js','shared/audio/speech-service.js']){
    assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
