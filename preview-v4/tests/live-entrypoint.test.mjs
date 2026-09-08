import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readPreview=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const readRoot=()=>readFile(new URL('../../index.html',import.meta.url),'utf8');
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('repository root routes directly into the learner-neutral family app',async()=>{
  const root=await readRoot();
  assert.match(root,/\.\/preview-v4\//);
  assert.match(root,/location\.replace/);
  assert.match(root,/تعلم العائلة/);
  assert.doesNotMatch(root,/تعلم ياسر وخالد/);
  assert.doesNotMatch(root,/تحدي ياسر — جدول الضرب V3/);
});

test('installed app identity is learner-neutral while runtime keeps the full games platform',async()=>{
  const html=await readPreview('index.html');
  const manifest=JSON.parse(await readPreview('manifest.webmanifest'));
  const main=await readPreview('src/main.js');
  assert.match(html,/<title>تعلم العائلة<\/title>|<title>تعلم ياسر وخالد<\/title>/);
  assert.equal(manifest.name,'تعلم العائلة');
  assert.equal(manifest.short_name,'تعلم العائلة');
  assert.match(main,/document\.title='تعلم العائلة'/);
  assert.match(main,/createGamesController/);
});

test('service worker shell includes cloud session restore, games, shared UI contracts, currency assets and open-family modules',async()=>{
  const worker=await readPreview('service-worker.js');
  assert.match(worker,/shell-71/);
  for(const path of [
    'ui/styles/character-scale.css',
    'ui/styles/learning-navigation.css',
    'shared/data/attempt-ledger.js',
    'shared/config/family-api-config.js',
    'shared/sync/family-auth-client.js',
    'shared/sync/family-sync-capability-registry.js',
    'shared/sync/family-sync-service.js',
    'shared/sync/session-sync.js',
    'modules/games/games-controller.js',
    'modules/khaled/domain/money-question-bank.js',
    'modules/khaled/ui/saudi-money-assets.js',
    'modules/khaled/ui/khaled-home.css',
    'modules/khaled/ui/khaled-device-hardening.css',
    'modules/parent/family-parent-controller.js'
  ])assert.match(worker,new RegExp(escapeRegExp(path)));
});
