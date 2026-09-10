import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controllerUrl=new URL('../src/modules/mashaal/ui/mashaal-treasure-controller.js',import.meta.url);
const cssUrl=new URL('../src/modules/mashaal/ui/mashaal-treasures.css',import.meta.url);
const swUrl=new URL('../service-worker-runtime.js',import.meta.url);

test('Mashaal treasures expose durable locked, unlocked and new presentation states',async()=>{
  const [controller,css]=await Promise.all([readFile(controllerUrl,'utf8'),readFile(cssUrl,'utf8')]);
  assert.match(controller,/data-reward-state=/);
  assert.match(controller,/viewState\?\.isNew\?\./);
  assert.match(controller,/mashaalRewardScopeCopy/);
  assert.match(css,/\.mashaal-treasure-card\.new/);
  assert.match(css,/@media\(min-width:900px\) and \(pointer:coarse\)/);
  assert.match(css,/@media\(prefers-reduced-motion:no-preference\)/);
});

test('Mashaal treasure presentation dependencies are available to first-install offline mode',async()=>{
  const sw=await readFile(swUrl,'utf8');
  assert.match(sw,/EXTENSION_CACHE_PREFIX='family-learning-runtime-extensions-'/);
  assert.match(sw,/EXTENSION_CACHE_VERSION=`\$\{EXTENSION_CACHE_PREFIX\}4`/);
  assert.match(sw,/mashaal-reward-theme\.js/);
  assert.match(sw,/reward-collection-view-state\.js/);
  assert.match(sw,/mashaal-treasure-controller\.js/);
  assert.match(sw,/mashaal-treasures\.css/);
});
