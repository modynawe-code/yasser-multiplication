import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../../',import.meta.url);

test('Android launcher follows the approved Yasser + Khaled + calculator contract',async()=>{
  const source=await readFile(new URL('tools/prepare-mobile-assets.mjs',root),'utf8');
  assert.match(source,/original\/yasser\/welcome\.png/);
  assert.match(source,/original\/khaled\/khaled-thumbsup\.png/);
  assert.match(source,/original\/assistant\/thinking\.png/);
  assert.match(source,/calculatorUri/);
  assert.doesNotMatch(source,/<text[\s>]/i);
  assert.doesNotMatch(source,/>×</);
});

test('Android workflow rebuilds when launcher composition changes',async()=>{
  const workflow=await readFile(new URL('.github/workflows/android-debug-apk.yml',root),'utf8');
  assert.match(workflow,/tools\/prepare-mobile-assets\.mjs/);
  assert.match(workflow,/Generate Android launcher icon/);
});
