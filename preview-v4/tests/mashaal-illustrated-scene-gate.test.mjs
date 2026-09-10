import test from 'node:test';
import assert from 'node:assert/strict';
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
  'help-tidy','leave-mess','scatter-toys',
  'balance','fine-motor'
]);

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
