import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled home hero keeps character and copy visually connected on landscape',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  assert.match(css,/grid-template-columns:minmax\(220px,\.68fr\) minmax\(0,1\.32fr\)/);
  assert.match(css,/gap:clamp\(10px,1\.5vw,18px\)/);
  assert.match(css,/\.khaled-home-copy\{[^}]*justify-self:start[^}]*width:min\(100%,520px\)/s);
  assert.match(css,/\.khaled-home-hero \.khaled-home-character\{[^}]*justify-self:end/s);
});

test('Khaled skill cards retain readable tablet typography',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-home.css');
  assert.match(css,/\.khaled-skill strong\{font-size:17px/);
  assert.match(css,/\.khaled-skill small\{font-size:13\.5px;line-height:1\.45/);
  assert.match(css,/\.khaled-skill em\{font-size:13px/);
});

test('money equality groups use denser piece sizing instead of crowding a comparison card',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-money.css');
  assert.match(css,/\.khaled-money-equality section \.khaled-money-set\{[^}]*gap:7px 9px/s);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:700px\) and \(max-height:900px\)[\s\S]*\.khaled-money-equality section \.khaled-money-piece\.note\{width:118px;height:56px\}/);
});
