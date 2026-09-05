import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readPreview=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const readRoot=()=>readFile(new URL('../../index.html',import.meta.url),'utf8');

test('repository root routes directly into the modular learning app',async()=>{
  const root=await readRoot();
  assert.match(root,/\.\/preview-v4\//);
  assert.match(root,/location\.replace/);
  assert.match(root,/تعلم ياسر وخالد/);
  assert.doesNotMatch(root,/تحدي ياسر — جدول الضرب V3/);
});

test('preview app and install manifest use the shared learner identity',async()=>{
  const html=await readPreview('index.html');
  const manifest=JSON.parse(await readPreview('manifest.webmanifest'));
  assert.match(html,/<title>تعلم ياسر وخالد<\/title>/);
  assert.equal(manifest.name,'تعلم ياسر وخالد');
  assert.equal(manifest.short_name,'ياسر وخالد');
});

test('service worker shell is current through chapter eight arithmetic strategies',async()=>{
  const worker=await readPreview('service-worker.js');
  assert.match(worker,/shell-21/);
  for(const path of [
    'modules/khaled/domain/addition-question-bank.js',
    'modules/khaled/domain/subtraction-question-bank.js',
    'modules/khaled/domain/add-sub-strategies-question-bank.js',
    'modules/khaled/ui/khaled-strategies-renderer.js',
    'modules/khaled/ui/khaled-strategies.css',
    'modules/parent/family-parent-controller.js'
  ])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
