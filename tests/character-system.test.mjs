import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('student home wires semantic character assets without touching learning modules',async()=>{
  const html=await read('index.html');
  const css=await read('src/ui/styles/character-system.css');
  assert.match(html,/src\/ui\/styles\/character-system\.css/);
  assert.match(html,/assets\/characters\/yasser-welcome\.webp/);
  assert.match(html,/assets\/assistant\/assistant-welcome\.webp/);
  assert.match(html,/mission-characters/);
  assert.match(css,/prefers-reduced-motion/);
});

test('offline shell caches character system assets',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/character-system\.css/);
  assert.match(worker,/yasser-welcome\.webp/);
  assert.match(worker,/assistant-welcome\.webp/);
});
