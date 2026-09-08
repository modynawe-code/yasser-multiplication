import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readPreview=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const readRoot=()=>readFile(new URL('../../index.html',import.meta.url),'utf8');
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('repository root routes directly into learner-neutral family app',async()=>{
  const root=await readRoot();
  assert.match(root,/\.\/preview-v4\//);
  assert.match(root,/location\.replace/);
  assert.match(root,/تعلم العائلة/);
  assert.doesNotMatch(root,/تعلم ياسر وخالد/);
});

test('installed app identity is learner-neutral while runtime owns active browser title',async()=>{
  const manifest=JSON.parse(await readPreview('manifest.webmanifest'));
  const main=await readPreview('src/main.js');
  assert.equal(manifest.name,'تعلم العائلة');
  assert.equal(manifest.short_name,'تعلم العائلة');
  assert.match(main,/document\.title='تعلم العائلة'/);
});

test('service worker shell includes open-family runtime and current KG3 activity shell',async()=>{
  const worker=await readPreview('service-worker.js');
  assert.match(worker,/shell-39/);
  for(const path of [
    'ui/styles/character-scale.css',
    'ui/styles/learning-navigation.css',
    'shared/data/attempt-ledger.js',
    'shared/config/family-api-config.js',
    'shared/sync/family-auth-client.js',
    'shared/sync/family-sync-service.js',
    'shared/learners/learner-registry.js',
    'shared/progress/evidence.js',
    'shared/activities/activity-types.js',
    'modules/hub/learner-runtime-registry.js',
    'modules/hub/learner-hub-registry.js',
    'modules/mashaal/curriculum/kg3-activity-catalog.js',
    'modules/mashaal/application/activity-release-validator.js',
    'modules/mashaal/application/activity-completion.js',
    'modules/mashaal/application/transfer-prompts.js',
    'modules/mashaal/ui/activity-view-model.js',
    'modules/mashaal/ui/mashaal-controller.js',
    'modules/mashaal/ui/mashaal.css',
    'modules/khaled/ui/khaled-device-hardening.css',
    'modules/parent/family-parent-controller.js',
    'modules/parent/family-parent-shell-registry.js'
  ])assert.match(worker,new RegExp(escapeRegExp(path)));
});
