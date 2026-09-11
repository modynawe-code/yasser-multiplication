import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getMashaalAssetContract } from '../src/modules/mashaal/ui/mashaal-asset-contracts.js';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';

// Hard release invariant requested after real Galaxy Tab review:
// child-facing narrative/action scenes must be full illustrated Mashaal scenes,
// not abstract/generated SVG/pictogram substitutes.
const ILLUSTRATED_SCENE_KEYS=Object.freeze([
  'girl-drinking-water',
  'wake','brush-teeth','breakfast',
  'wait-turn','grab-ball','walk-away-angry',
  'ask-help','throw-blocks','kick-blocks',
  'wet-hands','soap','rub-hands','rinse-hands',
  'stay-away','touch-hot','play-near-hot',
  'return-book','leave-book-floor','damage-book',
  'help-tidy','leave-mess','scatter-toys',
  'balance','fine-motor'
]);

// These exact image blobs passed structural QA but failed manual semantic screenshot review.
// Keeping their Git blob ids here makes CI stay red until the actual artwork bytes are replaced;
// changing CSS, renderMode, filenames, or metadata cannot hide a known-wrong scene.
const REJECTED_SEMANTIC_BLOBS=Object.freeze({
  'girl-drinking-water':'d74a2e6287867d4d5df552cc06f0346b404c0db5',
  wake:'bd8f81fc948c728935b0fa26151e01fc18f5af7f',
  'brush-teeth':'e35e9cfc1a11572473a1497a9aac5f41e1b0b2ab',
  breakfast:'6a55f66453ced9d8d037a1fb02f0e3e8cbd1f14c',
  'walk-away-angry':'1a111d81fa7c272abf0cd765ed70118e843ae174',
  'throw-blocks':'2ecdd00d6b9abcf4d2bd2025c48455c4f2bcdfed',
  'kick-blocks':'22dd9b45f7593d0a51b042af1985b99759e40e5d',
  'leave-book-floor':'5932fefc9b850231eeee9328c1b47891b1c52825',
  'damage-book':'6232733e655445e36a7cfb30f9d046dada59d032',
  'help-tidy':'e71b9ed82c0c5a9b530fba3d77c3478d0451c891',
  'leave-mess':'2e7f873c7e619c5c929effc21a136dda0e02388a',
  'scatter-toys':'f2e2a5f7f390f876e68fb60db7b8a65a29c49bab',
  'fine-motor':'119154933faf33cff25d7eaa244b99727b4b7fe9'
});

const gitBlobSha=bytes=>createHash('sha1')
  .update(`blob ${bytes.length}\0`)
  .update(bytes)
  .digest('hex');

test('Mashaal narrative scenes cannot regress to vector/pictogram artwork',()=>{
  for(const key of ILLUSTRATED_SCENE_KEYS){
    const contract=getMashaalAssetContract(key);
    assert.equal(
      contract.renderMode,
      'media',
      `${key}: must use a full illustrated Mashaal scene; vector/SVG pictograms are forbidden`
    );

    const media=getMashaalWebMedia(key);
    assert.ok(media,`${key}: must have a registered local illustrated scene`);
    assert.match(media.url,/^assets\/mashaal\/choices\/.+\.webp$/,`${key}: scene must be a local WebP asset`);
  }
});

test('known semantically wrong Mashaal artwork cannot be released unchanged',async()=>{
  for(const [key,rejectedSha] of Object.entries(REJECTED_SEMANTIC_BLOBS)){
    const media=getMashaalWebMedia(key);
    assert.ok(media,`${key}: media registration is required before semantic review`);
    const bytes=await readFile(new URL(`../${media.url}`,import.meta.url));
    const actualSha=gitBlobSha(bytes);
    assert.notEqual(
      actualSha,
      rejectedSha,
      `${key}: current artwork is the exact image rejected by semantic screenshot review; replace it with a scene that visibly performs ${getMashaalAssetContract(key).semanticFocus}`
    );
  }
});
