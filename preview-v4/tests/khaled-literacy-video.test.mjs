import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read=path=>readFile(new URL(`../${path}`,import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('Khaled literacy offers the existing lesson plus the two supplied videos',async()=>{
  const [module,home,existing,unitReview,spelling]=await Promise.all([
    read('src/modules/khaled/literacy/khaled-literacy.js').then(bytes=>bytes.toString('utf8')),
    read('src/modules/khaled/ui/khaled-home-shell.js').then(bytes=>bytes.toString('utf8')),
    read('assets/khaled/literacy/unit-1-family-letters-review.mp4'),
    read('assets/khaled/literacy/unit-1-family-review-2.mp4'),
    read('assets/khaled/literacy/syllable-spelling.mp4')
  ]);
  assert.match(module,/assets\/khaled\/literacy\/unit-1-family-letters-review\.mp4/);
  assert.match(module,/assets\/khaled\/literacy\/unit-1-family-review-2\.mp4/);
  assert.match(module,/assets\/khaled\/literacy\/syllable-spelling\.mp4/);
  assert.match(module,/id="khaledLiteracyVideo" controls playsinline preload="metadata"/);
  assert.match(module,/مراجعة الوحدة الأولى: الحروف والمقاطع/);
  assert.match(module,/قراءة المقاطع الصوتية بالتهجئة/);
  assert.match(module,/KHALED_LITERACY_VIDEOS=VIDEOS/);
  assert.match(home,/3 فيديوهات • مراجعة الحروف والمقاطع/);
  assert.equal(hash(existing),'bd13d76879655adc6ff70aa434dfa77585a14c6bf86e7ff9083781020498e3d9');
  assert.equal(hash(unitReview),'46b474a608e7d89ef698cc118363777a06ec8a8f622dd5bd3fab32d18c2b94db');
  assert.equal(hash(spelling),'389503663544462d43cfb7f0f4f140d2bab9e7d2548c9d7902ddac4f39098488');
});
