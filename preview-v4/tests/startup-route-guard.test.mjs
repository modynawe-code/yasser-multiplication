import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hubController=readFileSync(new URL('../src/modules/hub/hub-controller.js',import.meta.url),'utf8');

test('startup keeps the stale Yasser intro hidden until the learner hub is active',()=>{
  assert.match(index,/html\.js:not\(\.app-ready\) \.app\{visibility:hidden\}/);
  assert.match(index,/MutationObserver/);
  assert.match(index,/classList\.contains\('hub-mode'\)/);
  assert.match(index,/classList\.add\('app-ready'\)/);
  assert.match(hubController,/classList\.add\('hub-mode'\)/);
  assert.match(hubController,/classList\.remove\('intro-mode'/);
});
