import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=read('../tools/monopoly-tv-renderer/scene.mjs');
const entry=read('monopoly-party/tv/tv.js');
const css=read('monopoly-party/party.css');
const pkg=JSON.parse(read('../tools/monopoly-tv-renderer/package.json'));
test('real renderer uses pinned PixiJS and GSAP instead of inert dependency',()=>{
  assert.equal(pkg.dependencies['pixi.js'],'8.22.0');
  assert.equal(pkg.dependencies.gsap,'3.15.0');
  assert.match(scene,/import\s*\{[^}]*Application[^}]*\}\s*from\s*'pixi.js'/);
  assert.match(scene,/import\s*\{\s*gsap\s*\}\s*from\s*'gsap'/);
  assert.match(scene,/await app\.init\(/);
  assert.match(scene,/gsap\.to\(board,/);
  assert.match(scene,/gsap\.to\(actor\.position,/);
});
test('TV integrates local bundled renderer and retains DOM fallback',()=>{
  assert.match(entry,/import\('\.\.\/vendor\/cinematic-scene\.mjs'\)/);
  assert.match(entry,/cinematic\?\.sync\(state\)/);
  assert.match(entry,/await cinematic\.move\(/);
  assert.match(entry,/cinematic\.focus\(index,zoom\)/);
  assert.match(entry,/catch\(error=>\{console\.warn/);
  assert.match(css,/\.tv-board\.cinematic-ready \.tv-token\{visibility:hidden\}/);
});
test('rendering does not authorize server money, player actions or mutate snapshots',()=>{
  assert.doesNotMatch(scene,/submitAction|createRoom|fetch\(|\.cash\s*[+\-*/]?=|\.ownership\s*=/);
  assert.match(scene,/prefers-reduced-motion/);
  assert.match(scene,/function destroy\(/);
});
