import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listLearnerProfiles } from '../src/shared/learners/learner-registry.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('registered learners expose age-aware presentation metadata',()=>{
  const profiles=listLearnerProfiles();
  assert.deepEqual(profiles.map(profile=>profile.id),['yasser','khaled','mashaal']);
  for(const profile of profiles){
    assert.ok(profile.presentation?.stageLabel);
    assert.ok(profile.presentation?.homeVariant);
  }
  assert.equal(profiles.find(profile=>profile.id==='yasser').presentation.homeVariant,'older-child');
  assert.equal(profiles.find(profile=>profile.id==='khaled').presentation.homeVariant,'early-reader');
  assert.equal(profiles.find(profile=>profile.id==='mashaal').presentation.homeVariant,'preschool');
});

test('generic learner hub presentation supports future avatar assets without Mashaal hardcoding',async()=>{
  const source=await read('src/modules/hub/learner-hub-registry.js');
  assert.match(source,/profile\.presentation\?\.avatar/);
  assert.match(source,/dataset\.learnerVariant=profile\.presentation\?\.homeVariant/);
  assert.match(source,/presentation\?\.stageLabel/);
  assert.doesNotMatch(source,/profile\.id==='mashaal'/);
});

test('family chooser uses a tablet-first three-card composition with safe-area protection',async()=>{
  const css=await read('src/modules/hub/open-family-learner-grid.css');
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/max-width:1120px/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/\.learner-card small\{display:none\}/);
  assert.match(css,/@media\(max-width:620px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:430px\)[\s\S]*grid-template-columns:1fr/);
});
