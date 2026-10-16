import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled subject gateway uses a coherent two-column tablet layout',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-subject-gateway.css');
  assert.match(css,/\.khaled-subject-shell\{[^}]*grid-template-columns:minmax\(300px,\.78fr\) minmax\(0,1\.22fr\)[^}]*grid-template-areas:"hero subjects" "hero status"/s);
  assert.match(css,/\.khaled-subject-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css,/\.khaled-subject-card\.quran\{grid-column:1\/-1\}/);
  assert.match(css,/\.khaled-science-art\{background-size:1120px 1820px!important\}/);
});

test('Khaled math skill cards retain readable tablet typography',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  assert.match(css,/\.khaled-skill strong\{font-size:17px/);
  assert.match(css,/\.khaled-skill small\{font-size:13\.5px;line-height:1\.45/);
  assert.match(css,/\.khaled-skill em\{[^}]*font-size:13px/);
});

test('money equality groups stay denser than the enlarged primary currency stage',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-money.css');
  assert.match(css,/\.khaled-money-equality section \.khaled-money-set\{[^}]*gap:7px 9px/s);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:700px\) and \(max-height:900px\)[\s\S]*\.khaled-money-stage \.khaled-money-piece\.note\{width:210px;height:100px\}/);
});
