import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const ASSETS=Object.freeze({
  'assets/visual/original/khaled/khaled-point-thumbsup.png':'bdbc35cea45abf584b992629a6424f4b6461dccbce0ffeb936008dacb9de30f2',
  'assets/visual/original/khaled/khaled-star-badge.png':'bb8a975daf5a2a39740779504dcc64760bca315544e7b64c83b4be43b995552c',
  'assets/visual/original/khaled/khaled-thinking.png':'8cbb9c76084fe5367a48537df0979577a8ea8f7eea9e44d20960926578b53291',
  'assets/visual/original/khaled/khaled-celebration.png':'3ecb4906acab750b0230ead13fd27d4168e8108fd1b4170a6150af85b533c0cb',
  'assets/visual/original/khaled/khaled-thumbsup.png':'9c5fb726edcd7a62b7b8831fd5fa171925c074f8983dacc15a171df147fedd43',
  'assets/visual/original/khaled/group/khaled-thinking-with-calculator.png':'2b25222f4f81e020a5d112d73113d32e5c617fd494037f83b0cbdf5d3112c0f4',
  'assets/visual/original/khaled/group/khaled-celebration-with-calculator.png':'f3c516b9d0754223b7948dc85ea016eedee6788873b76afcd313b4881bc130c6'
});

const readText=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled original PNGs remain byte-identical to the approved source package',async()=>{
  for(const [path,expected] of Object.entries(ASSETS)){
    const bytes=await readFile(new URL(`../${path}`,import.meta.url));
    const actual=createHash('sha256').update(bytes).digest('hex');
    assert.equal(actual,expected,path);
    assert.equal(bytes.subarray(1,4).toString('ascii'),'PNG',`${path} is a PNG`);
  }
});

test('Khaled scene warmup does not preload all high-resolution artwork',async()=>{
  const source=await readText('src/modules/khaled/ui/khaled-scene-controller.js');
  assert.match(source,/WARM_ASSET_KEYS=Object\.freeze\(\['welcome','groupThinking'\]\)/);
  assert.match(source,/WARM_ASSET_KEYS\.forEach\(key=>canLoad\(ASSETS\[key\]\)\)/);
  assert.doesNotMatch(source,/Object\.values\(ASSETS\)\.forEach/);
});

test('Khaled feedback keeps full group artwork inside the stable session stage',async()=>{
  const controller=await readText('src/modules/khaled/ui/khaled-scene-controller.js');
  const css=await readText('src/modules/khaled/ui/khaled-character-system.css');
  assert.match(controller,/function feedback\(isCorrect\)\{return paint\('session',isCorrect\?'groupCelebration':'groupThinking'/);
  assert.doesNotMatch(controller,/function feedback\(isCorrect\).*?'encourage'/s);
  assert.match(css,/\.khaled-session-character\{[^}]*aspect-ratio:4\/3/s);
  assert.match(css,/\.khaled-session-character \.khaled-character-image\{[^}]*object-fit:contain/s);
});

test('Khaled result stage contains both group and portrait artwork without cropping',async()=>{
  const css=await readText('src/modules/khaled/ui/khaled-character-system.css');
  assert.match(css,/\.khaled-result-character\{[^}]*aspect-ratio:4\/3/s);
  assert.match(css,/\.khaled-result-character \.khaled-character-image\{[^}]*object-fit:contain/s);
  assert.match(css,/\.khaled-result-character \.khaled-character-image\{[^}]*object-position:center/s);
});

test('PWA keeps original Khaled PNGs runtime-cached instead of blocking install on them',async()=>{
  const worker=await readText('service-worker.js');
  assert.match(worker,/shell-\d+/);
  assert.doesNotMatch(worker,/assets\/visual\/original\/khaled\/.*\.png/);
});
