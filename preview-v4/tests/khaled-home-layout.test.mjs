import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled home keeps the guide rail and activity area connected on landscape',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  assert.match(css,/\.khaled-wrap\{[^}]*grid-template-columns:minmax\(300px,\.78fr\) minmax\(0,1\.22fr\)[^}]*grid-template-areas:"hero stats" "hero skills"/s);
  assert.match(css,/\.khaled-home-hero\{[^}]*grid-area:hero[^}]*grid-template-areas:"action" "copy" "character"/s);
  assert.match(css,/\.khaled-home-copy\{[^}]*justify-self:stretch[^}]*width:100%/s);
  assert.match(css,/\.khaled-home-hero \.khaled-home-character\{[^}]*width:min\(100%,330px\)[^}]*justify-self:center/s);
});

test('Khaled skill cards retain readable tablet typography',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  assert.match(css,/\.khaled-skill strong\{font-size:17px/);
  assert.match(css,/\.khaled-skill small\{font-size:13\.5px;line-height:1\.45/);
  assert.match(css,/\.khaled-skill em\{[^}]*font-size:13px/);
});

test('money equality groups stay denser than the enlarged primary currency stage',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-money.css');
  assert.match(css,/\.khaled-money-equality section \.khaled-money-set\{[^}]*gap:7px 9px/s);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:700px\) and \(max-height:900px\)[\s\S]*\.khaled-money-stage \.khaled-money-piece\.note\{width:210px;height:100px\}/);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:700px\) and \(max-height:900px\)[\s\S]*\.khaled-money-piece\.note\{width:148px;height:71px\}/);
});
