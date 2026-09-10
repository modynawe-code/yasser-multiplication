import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getMashaalAssetContract } from '../src/modules/mashaal/ui/mashaal-asset-contracts.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

const ACTION_KEYS=[
  'wait-turn','grab-ball','walk-away-angry','ask-help','throw-blocks','kick-blocks',
  'return-book','leave-book-floor','damage-book'
];
const SEMANTIC_VECTOR_KEYS=Object.freeze({
  'girl-drinking-water':'child-drinking-water',
  wake:'wake-up',
  'brush-teeth':'brushing-teeth',
  breakfast:'eating-breakfast',
  'help-tidy':'helping-tidy',
  'leave-mess':'leaving-mess',
  'scatter-toys':'scattering-toys'
});
const ILLUSTRATED_MEDIA_KEYS=Object.freeze({
  'wet-hands':'hands-under-water',
  soap:'soap-on-hands',
  'rub-hands':'rubbing-hands',
  'rinse-hands':'rinsing-hands',
  'stay-away':'safe-distance-from-hot-surface',
  'touch-hot':'touching-hot-surface',
  'play-near-hot':'playing-near-hot-surface',
  balance:'balance-one-foot'
});

test('remaining scenario boards carry explicit semantic crop contracts',()=>{
  for(const key of ACTION_KEYS){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.role,'action-scene',key);
    assert.equal(contract.fit,'cover',key);
    assert.ok(contract.semanticFocus&&contract.semanticFocus!=='whole-subject',key);
    assert.ok(Number(contract.cropScale)>=1.18,key);
  }
});

test('remaining ambiguous task boards use explicit semantic vector scenes',()=>{
  for(const [key,semanticFocus] of Object.entries(SEMANTIC_VECTOR_KEYS)){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.role,'semantic-scene',key);
    assert.equal(contract.renderMode,'vector',key);
    assert.equal(contract.semanticFocus,semanticFocus,key);
    assert.equal(contract.cropScale,1,key);
  }
});

test('approved Mashaal action scenes use illustrated media contracts',()=>{
  for(const [key,semanticFocus] of Object.entries(ILLUSTRATED_MEDIA_KEYS)){
    const contract=getMashaalAssetContract(key);
    assert.equal(contract.renderMode,'media',key);
    assert.equal(contract.semanticFocus,semanticFocus,key);
    assert.equal(contract.cropScale,1,key);
  }
});

test('gross motor uses illustrated media while fine motor still rejects its wrong bitmap',()=>{
  const balance=getMashaalAssetContract('balance');
  const fine=getMashaalAssetContract('fine-motor');
  assert.equal(balance.renderMode,'media');
  assert.equal(balance.semanticFocus,'balance-one-foot');
  assert.equal(fine.renderMode,'vector');
  assert.equal(fine.semanticFocus,'transfer-three-safe-pieces');
});

test('guided action SVG fallbacks depict motor and daily-life tasks without external image dependency',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-guided-action-visuals.js');
  for(const semanticFocus of [
    'balance-one-foot','transfer-three-safe-pieces','child-drinking-water',
    'wake-up','brushing-teeth','eating-breakfast'
  ])assert.match(source,new RegExp(semanticFocus));
  assert.match(source,/<svg viewBox=/);
  assert.doesNotMatch(source,/<image\b|href=["']https?:\/\//);
});

test('semantic choice SVG fallbacks remain local while illustrated media takes priority',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-semantic-choice-visuals.js');
  for(const semanticFocus of [
    'hands-under-water','soap-on-hands','rubbing-hands','rinsing-hands',
    'safe-distance-from-hot-surface','touching-hot-surface','playing-near-hot-surface',
    'helping-tidy','leaving-mess','scattering-toys'
  ])assert.match(source,new RegExp(semanticFocus));
  assert.match(source,/<svg viewBox=/);
  assert.doesNotMatch(source,/<image\b|href=["']https?:\/\//);
});

test('visual renderer prioritizes contract media for gross motor and vectors for remaining fallbacks',async()=>{
  const source=await read('src/modules/mashaal/ui/mashaal-visuals.js');
  assert.match(source,/createMashaalSemanticChoiceVisual/);
  assert.match(source,/function contractVectorVisual/);
  assert.match(source,/contract\.renderMode!==['"]vector['"]/);
  assert.match(source,/createMashaalGuidedActionVisual\(contract\.semanticFocus/);
  assert.match(source,/createMashaalSemanticChoiceVisual\(contract\.semanticFocus/);
  assert.match(source,/const vector=contractVectorVisual\(String\(key\)/);
  assert.match(source,/const vector=contractVectorVisual\(stimulus\.scene/);
  assert.match(source,/dataset\.assetRole=contract\.role/);
  assert.match(source,/dataset\.semanticFocus=contract\.semanticFocus/);
  assert.match(source,/dataset\.cropScale=String\(contract\.cropScale\|\|1\)/);
  assert.match(source,/const cropScale=compact\?1:Number\(contract\.cropScale\|\|1\)/);
  assert.match(source,/transform-origin/);
  assert.match(source,/getMashaalAssetContract\(['"]balance['"]\)/);
  assert.match(source,/contract\.renderMode===['"]media['"]&&media/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.movement/);
  assert.match(source,/createMashaalGuidedActionVisual\(stimulus\.task/);
});

test('speaking and compact vectors retain explicit task-sized CSS contracts',async()=>{
  const css=await read('src/modules/mashaal/ui/mashaal-web-media.css');
  assert.match(css,/data-asset-fit="cover"/);
  assert.match(css,/data-layout="guided-speaking"/);
  assert.match(css,/mashaal-guided-action-art\.compact\{width:100%;max-width:180px/);
  assert.match(css,/guided-speaking[^\n]+mashaal-guided-action-art/);
});
