import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getMashaalAssetContract } from '../src/modules/mashaal/ui/mashaal-asset-contracts.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

const ACTION_KEYS=[
  'wait-turn','grab-ball','walk-away-angry','ask-help','throw-blocks','kick-blocks',
  'wet-hands','soap','rub-hands','rinse-hands','stay-away','touch-hot','play-near-hot',
  'return-book','leave-book-floor','damage-book','help-tidy','leave-mess','scatter-toys'
];

test('scenario action assets carry semantic crop contracts instead of inheriting one global image fit',()=>{
  for(const key of ACTION_KEYS){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.role,'action-scene',key);
    assert.equal(contract.fit,'cover',key);
    assert.ok(contract.semanticFocus&&contract.semanticFocus!=='whole-subject',key);
  }
});

test('gross and fine motor reject the semantically wrong bitmap as the primary renderer',()=>{
  const balance=getMashaalAssetContract('balance');
  const fine=getMashaalAssetContract('fine-motor');
  assert.equal(balance.renderMode,'vector');
  assert.equal(balance.semanticFocus,'balance-one-foot');
  assert.equal(fine.renderMode,'vector');
  assert.equal(fine.semanticFocus,'transfer-three-safe-pieces');
});

test('guided action SVGs depict the required motor actions and contain no external image dependency',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-guided-action-visuals.js');
  assert.match(source,/balance-one-foot/);
  assert.match(source,/transfer-three-safe-pieces/);
  assert.match(source,/<svg viewBox=/);
  assert.doesNotMatch(source,/<image\b|href=["']https?:\/\//);
});

test('visual renderer consumes asset contracts before constructing media and motor visuals',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-visuals.js');
  assert.match(source,/getMashaalAssetContract/);
  assert.match(source,/dataset\.assetRole=contract\.role/);
  assert.match(source,/dataset\.semanticFocus=contract\.semanticFocus/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.movement/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.task/);
});

test('speaking activity and action crops retain explicit task-sized CSS contracts',async()=>{
  const css=await read('src/modules/mashaal/ui/mashaal-web-media.css');
  assert.match(css,/data-asset-fit="cover"/);
  assert.match(css,/object-position:78% 52%/);
  assert.match(css,/data-layout="guided-speaking"/);
  assert.match(css,/mashaal-guided-action-art/);
});
