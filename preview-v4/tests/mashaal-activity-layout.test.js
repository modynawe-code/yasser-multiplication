import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getMashaalKg3Activity } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';
import { getMashaalActivityLayout } from '../src/modules/mashaal/ui/activity-layout.js';

const model=id=>createMashaalActivityViewModel(getMashaalKg3Activity(id));

test('Mashaal activities use layout modes instead of per-screen CSS patches',()=>{
  assert.deepEqual(getMashaalActivityLayout(model('kg3-handwashing-sequence-01')),{mode:'sequence',choiceCount:4,hideStimulus:true});
  assert.deepEqual(getMashaalActivityLayout(model('kg3-compare-quantity-01')),{mode:'comparison',choiceCount:2,hideStimulus:true});
  assert.equal(getMashaalActivityLayout(model('kg3-gross-motor-01')).mode,'guided-movement');
  assert.equal(getMashaalActivityLayout(model('kg3-fine-motor-01')).mode,'guided-fine-motor');
  assert.equal(getMashaalActivityLayout(model('kg3-express-feeling-01')).mode,'guided-emotion');
  assert.equal(getMashaalActivityLayout(model('kg3-count-quantity-01')).mode,'counting');
  assert.equal(getMashaalActivityLayout(model('kg3-recognize-emotion-01')).mode,'choice');
});

test('ordered activities do not render a duplicate answer-revealing stimulus row',()=>{
  for(const id of ['kg3-handwashing-sequence-01','kg3-story-sequence-01','kg3-listen-two-step-choice-01']){
    assert.equal(getMashaalActivityLayout(model(id)).hideStimulus,true,id);
  }
});

test('choice activities hide any stimulus that repeats the correct answer artwork',()=>{
  for(const id of ['kg3-spatial-position-01','kg3-turn-taking-01']){
    assert.equal(getMashaalActivityLayout(model(id)).hideStimulus,true,id);
  }
});

test('activity shell loads the dedicated responsive layout module',async()=>{
  const shell=await readFile(new URL('../src/modules/mashaal/ui/mashaal-shell.js',import.meta.url),'utf8');
  assert.match(shell,/mashaal-activity-layout\.css/);
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-activity-layout.css',import.meta.url),'utf8');
  assert.match(css,/data-choice-count="4"/);
  assert.match(css,/data-layout="comparison"/);
  assert.match(css,/max-height:700px/);
});

test('controller exposes layout metadata and ordered touch sequence numbers',async()=>{
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  assert.match(controller,/dataset\.layout=layout\.mode/);
  assert.match(controller,/dataset\.choiceCount=String\(layout\.choiceCount\)/);
  assert.match(controller,/button\.dataset\.order=String\(selectedChoices\.size\)/);
});

test('offline shell versions and caches the activity layout modules',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/shell-85/);
  assert.match(sw,/activity-layout\.js/);
  assert.match(sw,/activity-renderer-contracts\.js/);
  assert.match(sw,/mashaal-activity-layout\.css/);
});

test('guided KG3 visuals have explicit large tablet presentation rules',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-activity-layout.css',import.meta.url),'utf8');
  assert.match(css,/data-layout="guided-emotion"/);
  assert.match(css,/data-layout="guided-movement"/);
  assert.match(css,/data-layout="guided-fine-motor"/);
  assert.match(css,/width:min\(470px,70vw\)/);
});
