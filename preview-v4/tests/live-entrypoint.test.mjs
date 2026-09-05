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

test('service worker shell includes cloud sync and Khaled device hardening',async()=>{
  const worker=await readPreview('service-worker.js');
  assert.match(worker,/shell-31/);
  for(const path of [
    'shared/data/attempt-ledger.js',
    'shared/config/family-api-config.js',
    'shared/sync/family-auth-client.js',
    'shared/sync/family-sync-service.js',
    'modules/khaled/domain/money-question-bank.js',
    'modules/khaled/ui/khaled-device-hardening.css',
    'modules/parent/family-parent-controller.js'
  ])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
