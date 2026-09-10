import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getMashaalActivityLayout } from '../src/modules/mashaal/ui/activity-layout.js';

const CASES=Object.freeze([
  ['ordered-sequence','ordered-grid'],
  ['counting-choice','choice-grid'],
  ['comparison-choice','choice-grid'],
  ['multi-select','choice-grid'],
  ['pattern-choice','choice-grid'],
  ['spatial-choice','choice-grid'],
  ['scene-choice','choice-grid'],
  ['scene-choice-options-only','choice-grid'],
  ['guided-speaking','guided-speaking'],
  ['guided-tracing','guided-tracing'],
  ['guided-emotion','guided-emotion'],
  ['guided-movement','guided-movement'],
  ['guided-fine-motor','guided-fine-motor']
]);

test('Mashaal activities use layout modes instead of per-screen CSS patches',()=>{
  for(const [activityType,mode] of CASES){
    const layout=getMashaalActivityLayout({activityType,choices:['a','b','c']});
    assert.equal(layout.mode,mode,activityType);
    assert.equal(layout.activityType,activityType,activityType);
  }
});

test('ordered activities do not render a duplicate answer-revealing stimulus row',()=>{
  const layout=getMashaalActivityLayout({activityType:'ordered-sequence',choices:['a','b','c']});
  assert.equal(layout.showStimulus,false);
  assert.equal(layout.showChoices,true);
});

test('choice activities hide any stimulus that repeats the correct answer artwork',()=>{
  const layout=getMashaalActivityLayout({activityType:'scene-choice',choices:['umbrella','ball'],stimulus:{kind:'picture',scene:'umbrella'}});
  assert.equal(layout.showStimulus,false);
});

test('activity shell loads the dedicated responsive layout module',async()=>{
  const shell=await readFile(new URL('../src/modules/mashaal/ui/mashaal-shell.js',import.meta.url),'utf8');
  assert.match(shell,/mashaal-activity-layout\.css/);
});

test('controller exposes layout metadata and ordered touch sequence numbers',async()=>{
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  assert.match(controller,/dataset\.layout=layout\.mode/);
  assert.match(controller,/dataset\.choiceCount=String\(layout\.choiceCount\)/);
  assert.match(controller,/button\.dataset\.order=String\(selectedChoices\.size\)/);
});

test('offline shell versions and caches the activity layout modules',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/shell-83/);
  assert.match(sw,/activity-layout\.js/);
  assert.match(sw,/mashaal-activity-layout\.css/);
});

test('guided KG3 visuals have explicit large tablet presentation rules',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-activity-layout.css',import.meta.url),'utf8');
  assert.match(css,/data-layout="guided-emotion"/);
  assert.match(css,/data-layout="guided-movement"/);
  assert.match(css,/data-layout="guided-fine-motor"/);
});
