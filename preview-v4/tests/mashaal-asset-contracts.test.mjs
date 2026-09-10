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
const HIGH_FOCUS_KEYS=[
  'wet-hands','soap','rub-hands','rinse-hands',
  'stay-away','touch-hot','play-near-hot',
  'help-tidy','leave-mess','scatter-toys'
];
const SEMANTIC_VECTOR_KEYS=Object.freeze({
  'girl-drinking-water':'child-drinking-water',
  wake:'wake-up',
  'brush-teeth':'brushing-teeth',
  breakfast:'eating-breakfast'
});

test('scenario action assets carry semantic crop contracts instead of inheriting one global image fit',()=>{
  for(const key of ACTION_KEYS){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.role,'action-scene',key);
    assert.equal(contract.fit,'cover',key);
    assert.ok(contract.semanticFocus&&contract.semanticFocus!=='whole-subject',key);
    assert.ok(Number(contract.cropScale)>=1.18,key);
  }
});

test('weak face-dominant boards zoom toward the task cue instead of preserving the full portrait',()=>{
  for(const key of HIGH_FOCUS_KEYS){
    const contract=getMashaalAssetContract(key);
    assert.ok(Number(contract.cropScale)>=1.28,key);
    assert.match(contract.position,/^(?:9[0-9]|100)%\s/,key);
  }
});

test('ambiguous daily-action bitmaps are replaced by explicit semantic vector scenes',()=>{
  for(const [key,semanticFocus] of Object.entries(SEMANTIC_VECTOR_KEYS)){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.role,'semantic-scene',key);
    assert.equal(contract.renderMode,'vector',key);
    assert.equal(contract.semanticFocus,semanticFocus,key);
    assert.equal(contract.cropScale,1,key);
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

test('guided action SVGs depict all semantic tasks and contain no external image dependency',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-guided-action-visuals.js');
  for(const semanticFocus of [
    'balance-one-foot','transfer-three-safe-pieces','child-drinking-water',
    'wake-up','brushing-teeth','eating-breakfast'
  ])assert.match(source,new RegExp(semanticFocus));
  assert.match(source,/<svg viewBox=/);
  assert.doesNotMatch(source,/<image\b|href=["']https?:\/\//);
});

test('visual renderer prioritizes vector contracts before legacy bitmap media',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-visuals.js');
  assert.match(source,/function contractVectorVisual/);
  assert.match(source,/contract\.renderMode!==['"]vector['"]/);
  assert.match(source,/createMashaalGuidedActionVisual\(contract\.semanticFocus/);
  assert.match(source,/const vector=contractVectorVisual\(String\(key\)/);
  assert.match(source,/const vector=contractVectorVisual\(stimulus\.scene/);
  assert.match(source,/dataset\.assetRole=contract\.role/);
  assert.match(source,/dataset\.semanticFocus=contract\.semanticFocus/);
  assert.match(source,/dataset\.cropScale=String\(contract\.cropScale\|\|1\)/);
  assert.match(source,/const cropScale=compact\?1:Number\(contract\.cropScale\|\|1\)/);
  assert.match(source,/transform-origin/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.movement/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.task/);
});

test('speaking, compact vectors and action crops retain explicit task-sized CSS contracts',async()=>{
  const css=await read('src/modules/mashaal/ui/mashaal-web-media.css');
  assert.match(css,/data-asset-fit="cover"/);
  assert.match(css,/data-layout="guided-speaking"/);
  assert.match(css,/mashaal-guided-action-art\.compact\{width:100%;max-width:180px/);
  assert.match(css,/guided-speaking[^\n]+mashaal-guided-action-art/);
});
