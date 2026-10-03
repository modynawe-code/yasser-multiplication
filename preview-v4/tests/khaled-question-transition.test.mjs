import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('new Khaled questions reset feedback and expose rendered option count',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(controller,/byId\('khaledFeedback'\)\.textContent='';/);
  assert.match(controller,/delete answers\.dataset\.optionCount/);
  assert.match(controller,/finalizeAnswerLayout\(answers\)/);
  assert.match(controller,/answers\.dataset\.optionCount=String\(count\)/);
});

test('Khaled scene painting ignores stale async artwork requests',async()=>{
  const scenes=await read('src/modules/khaled/ui/khaled-scene-controller.js');
  assert.match(scenes,/const paintEpoch=new Map\(\)/);
  assert.match(scenes,/paintEpoch\.set\(slot,epoch\)/);
  assert.match(scenes,/if\(paintEpoch\.get\(slot\)!==epoch\)return false/);
});

test('three-option money questions use a balanced row and centered mobile fallback',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-money.css');
  assert.match(css,/count-money[^}]*data-option-count="3"[^}]*grid-template-columns:repeat\(3,minmax\(140px,1fr\)\)/s);
  assert.match(css,/@media\(max-width:620px\)[\s\S]*data-option-count="3"[^}]*grid-template-columns:repeat\(2,minmax\(120px,1fr\)\)/);
  assert.match(css,/data-option-count="3"[^}]*>:last-child\{grid-column:1\/-1[^}]*justify-self:center/);
});
