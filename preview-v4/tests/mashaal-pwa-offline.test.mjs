import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

const REQUIRED_MASHAAL_RENDERER_MODULES=[
  './src/modules/mashaal/ui/mashaal-asset-contracts.js',
  './src/modules/mashaal/ui/mashaal-guided-action-visuals.js'
];

test('Mashaal semantic renderer dependencies are precached for deterministic offline startup',async()=>{
  const worker=await read('service-worker.js');
  for(const path of REQUIRED_MASHAAL_RENDERER_MODULES)assert.ok(worker.includes(`'${path}'`),path);
  assert.match(worker,/CACHE_VERSION=`\$\{CACHE_PREFIX\}shell-83`/);
});

test('the precached renderer modules match the imports used by Mashaal visuals',async()=>{
  const visuals=await read('src/modules/mashaal/ui/mashaal-visuals.js');
  assert.match(visuals,/from ['"]\.\/mashaal-asset-contracts\.js['"]/);
  assert.match(visuals,/from ['"]\.\/mashaal-guided-action-visuals\.js['"]/);
});
