import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled source asset manifest preserves all seven uploaded masters',async()=>{
  const manifest=JSON.parse(await read('docs/khaled-character-assets.v1.json'));
  assert.equal(manifest.character,'khaled');
  assert.equal(manifest.assets.length,7);
  assert.match(manifest.sourcePolicy,/Do not resize, crop, recompress, or re-encode/);
  const keys=manifest.assets.map(asset=>asset.key);
  for(const key of ['welcome','mastered','thinking','celebrate','encourage','group-thinking','group-celebration'])assert.ok(keys.includes(key));
  for(const asset of manifest.assets){
    assert.ok(asset.width>=1086);
    assert.ok(asset.height>=1086);
    assert.match(asset.sha256,/^[a-f0-9]{64}$/);
    assert.match(asset.repoPath,/assets\/visual\/original\/khaled/);
  }
});

test('Khaled scene controller maps learning states without requiring image binaries to boot',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-scene-controller.js');
  assert.match(controller,/groupThinking/);
  assert.match(controller,/groupCelebration/);
  assert.match(controller,/pct>=90/);
  assert.match(controller,/pct>=70/);
  assert.match(controller,/image\.onerror=\(\)=>resolve\(false\)/);
  assert.match(controller,/fallback\.hidden=false/);
});

test('learning shell has stable Khaled image slots with non-image fallbacks',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  for(const id of ['hubKhaledCharacter','khaledHomeCharacter','khaledSessionCharacter','khaledResultCharacter'])assert.match(shell,new RegExp(`id="${id}"`));
  for(const id of ['hubKhaledFallback','khaledHomeCharacterFallback','khaledSessionCharacterFallback','khaledResultCharacterFallback'])assert.match(shell,new RegExp(`id="${id}"`));
});

test('Khaled character CSS preserves aspect ratio and reduced motion preference',async()=>{
  const css=await read('src/modules/khaled/ui/khaled-character-system.css');
  assert.match(css,/object-fit:contain/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/khaledCelebrate/);
});
