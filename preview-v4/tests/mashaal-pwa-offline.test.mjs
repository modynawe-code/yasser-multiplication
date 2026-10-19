import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

const REQUIRED_MASHAAL_RENDERER_MODULES=[
  './src/shared/activities/activity-renderer-contracts.js',
  './src/modules/mashaal/ui/mashaal-asset-contracts.js',
  './src/modules/mashaal/ui/mashaal-guided-action-visuals.js',
  './src/modules/mashaal/ui/mashaal-semantic-choice-visuals.js'
];
const REQUIRED_ILLUSTRATED_MEDIA=[
  './assets/mashaal/choices/girl-drinking-water.webp',
  './assets/mashaal/choices/fine-motor.webp'
];

test('Mashaal renderer dependencies and illustrated media are precached for deterministic offline startup',async()=>{
  const worker=await read('service-worker.js');
  for(const path of [...REQUIRED_MASHAAL_RENDERER_MODULES,...REQUIRED_ILLUSTRATED_MEDIA])assert.ok(worker.includes(`'${path}'`),path);
  assert.match(worker,/CACHE_VERSION=`\$\{CACHE_PREFIX\}shell-85`/);
});

test('the precached renderer modules match imports used by Mashaal activity layout and visuals',async()=>{
  const visuals=await read('src/modules/mashaal/ui/mashaal-visuals.js');
  const layout=await read('src/modules/mashaal/ui/activity-layout.js');
  assert.match(visuals,/from ['"]\.\/mashaal-asset-contracts\.js['"]/);
  assert.match(visuals,/from ['"]\.\/mashaal-guided-action-visuals\.js['"]/);
  assert.match(visuals,/from ['"]\.\/mashaal-semantic-choice-visuals\.js['"]/);
  assert.match(layout,/from ['"]\.\.\/\.\.\/\.\.\/shared\/activities\/activity-renderer-contracts\.js['"]/);
});
