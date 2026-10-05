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
  assert.equal(hash(unitReview),'bba24a8519ec3ce08ec7d665e7b66919daeeef163f1b6f7a76f3d9bedb819b97');
  assert.equal(hash(spelling),'7e04b8b8e23540cf03d4554ba882a7db6484104ce7b876238642c4310f4024ed');
});
