import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {YASSER_SCIENCE_BOOK_VISUAL_ASSETS} from '../src/modules/yasser/science/science-book-visuals.generated.js';
import {YASSER_SCIENCE_VISUAL_ASSETS} from '../src/modules/yasser/science/science-visuals.js';

const LEGACY_ASSETS=[
  'cell-comparison-exam.webp',
  'organization-levels-exam.webp',
  'meiosis-exam.webp',
  'heart-exam.webp',
  'bird-nest-exam.webp',
  'pedigree-summary.webp'
];

const assertWebP=async(url,label)=>{
  const data=await readFile(url);
  assert.ok(data.length>4000,`${label}: unexpectedly small`);
  assert.equal(data.subarray(0,4).toString('ascii'),'RIFF',`${label}: RIFF header`);
  assert.equal(data.subarray(8,12).toString('ascii'),'WEBP',`${label}: WEBP signature`);
  assert.equal(data.length,data.readUInt32LE(4)+8,`${label}: truncated or malformed WebP`);
};

test('legacy Yasser science WebP assets stay complete for later chapters',async()=>{
  for(const name of LEGACY_ASSETS){
    await assertWebP(new URL(`../assets/science/yasser/${name}`,import.meta.url),name);
  }
});

test('chapter-one visual assets come from exact textbook excerpts, not reconstructed SVGs',async()=>{
  const entries=Object.entries(YASSER_SCIENCE_BOOK_VISUAL_ASSETS);
  assert.ok(entries.length>=15,`textbook visual count=${entries.length}`);
  assert.deepEqual(Object.keys(YASSER_SCIENCE_VISUAL_ASSETS).sort(),Object.keys(YASSER_SCIENCE_BOOK_VISUAL_ASSETS).sort());
  const hashes=new Set();
  for(const [id,asset] of entries){
    assert.equal(asset.source.kind,'textbook-exact',`${id}: source kind`);
    assert.equal(asset.source.authority,'textbook',`${id}: source authority`);
    assert.ok(asset.source.page>=14&&asset.source.page<=58,`${id}: chapter-one page ${asset.source.page}`);
    assert.match(asset.src,/^assets\/science\/yasser\/book\/.+\.webp$/,`${id}: local textbook asset path`);
    assert.ok(!asset.src.startsWith('data:'),`${id}: must not be generated data URI`);
    assert.ok(asset.source.sha256,`${id}: source hash`);
    hashes.add(asset.source.sha256);
    await assertWebP(new URL(`../${asset.src}`,import.meta.url),id);
  }
  assert.ok(hashes.size>=10,`expected at least 10 distinct textbook excerpts, got ${hashes.size}`);
});
