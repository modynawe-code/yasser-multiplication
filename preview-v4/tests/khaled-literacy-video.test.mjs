import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read=path=>readFile(new URL(`../${path}`,import.meta.url));

test('Khaled literacy review plays the supplied video file unchanged',async()=>{
  const [module,video]=await Promise.all([
    read('src/modules/khaled/literacy/khaled-literacy.js').then(bytes=>bytes.toString('utf8')),
    read('assets/khaled/literacy/unit-1-family-letters-review.mp4')
  ]);
  assert.match(module,/assets\/khaled\/literacy\/unit-1-family-letters-review\.mp4/);
  assert.match(module,/<video controls playsinline preload="metadata"/);
  assert.match(module,/مراجعة حروف الوحدة الأولى: أسرتي/);
  assert.equal(createHash('sha256').update(video).digest('hex'),'bd13d76879655adc6ff70aa434dfa77585a14c6bf86e7ff9083781020498e3d9');
});
