import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_OPEN_LEARNING_SOURCES,getMashaalOpenLearningSource } from '../src/modules/mashaal/curriculum/open-learning-source-registry.js';
import { MASHAAL_OPEN_ACTIVITY_BANK,listMashaalOpenActivitiesBySource } from '../src/modules/mashaal/curriculum/open-learning-activity-bank.js';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';
import { MASHAAL_PRATHAM_OPEN_PACKS,listMashaalPrathamPackImagePaths } from '../src/modules/mashaal/curriculum/pratham-open-packs.js';

test('open learning source registry keeps explicit licenses',()=>{
  assert.equal(getMashaalOpenLearningSource('kenney-cc0').license,'CC0 1.0');
  assert.equal(getMashaalOpenLearningSource('storyweaver-ccby').license,'CC BY 4.0');
  assert.equal(getMashaalOpenLearningSource('bookdash-ccby').license,'CC BY 4.0');
  assert.equal(getMashaalOpenLearningSource('african-storybook-ccby').license,'CC BY 4.0');
  assert.equal(getMashaalOpenLearningSource('illustrative-math-k').license,'CC BY-NC-SA 4.0');
  assert.ok(Object.keys(MASHAAL_OPEN_LEARNING_SOURCES).length>=6);
});

test('first open activity bank contains thirty sourced KG3 ideas',()=>{
  assert.equal(MASHAAL_OPEN_ACTIVITY_BANK.length,30);
  assert.equal(new Set(MASHAAL_OPEN_ACTIVITY_BANK.map(item=>item.id)).size,30);
  assert.ok(MASHAAL_OPEN_ACTIVITY_BANK.every(item=>getMashaalOpenLearningSource(item.sourceId)));
  assert.ok(listMashaalOpenActivitiesBySource('kenney-cc0').length>=7);
  assert.ok(listMashaalOpenActivitiesBySource('bookdash-ccby').length>=7);
});

test('Kenney animal media is local, offline-ready and uniformly licensed',()=>{
  for(const key of ['duck','dog','parrot','cow','frog','owl','pig','chicken','giraffe','monkey','penguin','rabbit']){
    const media=getMashaalWebMedia(key);
    assert.ok(media);
    assert.match(media.url,/^assets\/oer\/kenney\/animals\//);
    assert.equal(media.license,'CC0 1.0');
    assert.equal(media.source,'Kenney Animal Pack Remastered');
  }
});

test('first imported CC0 activities are playable and explicitly source-tagged',async()=>{
  const { getMashaalKg3Activity }=await import('../src/modules/mashaal/curriculum/kg3-activity-catalog.js');
  for(const id of ['kg3-open-animal-memory-01','kg3-open-animal-count-01','kg3-open-animal-puzzle-01','kg3-open-animal-sort-01']){
    const activity=getMashaalKg3Activity(id);
    assert.ok(activity,id);
    assert.equal(activity.assetSourceId,'kenney-cc0');
  }
});


test('imported Pratham packs keep source metadata and 88 original illustrations',()=>{
  assert.equal(Object.keys(MASHAAL_PRATHAM_OPEN_PACKS).length,6);
  assert.equal(Object.values(MASHAAL_PRATHAM_OPEN_PACKS).reduce((sum,pack)=>sum+pack.imageCount,0),88);
  for(const pack of Object.values(MASHAAL_PRATHAM_OPEN_PACKS))assert.equal(pack.license,'CC BY 4.0');
  assert.deepEqual(MASHAAL_PRATHAM_OPEN_PACKS['0120'].selectedFiles,['03.jpg','05.jpg','09.jpg']);
});

test('all 88 original illustrations are reachable through the six local image banks',()=>{
  const ids=Object.keys(MASHAAL_PRATHAM_OPEN_PACKS),paths=ids.flatMap(id=>listMashaalPrathamPackImagePaths(id));
  assert.equal(paths.length,88);
  assert.equal(new Set(paths).size,88);
  for(const path of paths)assert.match(path,/^assets\/oer\/pratham\/\d{4}\/\d{2}\.jpg$/);
});

test('six Pratham puzzle banks expose every image in their source pack',async()=>{
  const { getMashaalKg3Activity }=await import('../src/modules/mashaal/curriculum/kg3-activity-catalog.js');
  const { createMashaalActivityViewModel }=await import('../src/modules/mashaal/ui/activity-view-model.js');
  const banks={
    'kg3-open-tree-puzzle-bank-01':'0433','kg3-open-seed-puzzle-bank-01':'0352','kg3-open-nature-puzzle-01':'0071',
    'kg3-open-tinku-puzzle-bank-01':'0056','kg3-open-moru-puzzle-01':'0006','kg3-open-zoo-puzzle-01':'0120'
  };
  for(const [activityId,packId] of Object.entries(banks)){
    const activity=getMashaalKg3Activity(activityId);assert.ok(activity,activityId);assert.equal(activity.stimulus.kind,'picture-puzzle-bank');assert.equal(activity.stimulus.packId,packId);
    const model=createMashaalActivityViewModel(activity);assert.deepEqual([...model.stimulus.imagePaths],[...listMashaalPrathamPackImagePaths(packId)]);
  }
});

test('Pratham illustration media is local and source-backed',()=>{
  for(const key of ['pratham-tree-leaves','pratham-tree-flowers','pratham-tree-fruits','pratham-tree-seeds','pratham-color-blue','pratham-color-yellow','pratham-color-orange','pratham-seed-walk','pratham-seed-tree','pratham-seed-fruit','pratham-tinku-farm','pratham-tinku-firefly','pratham-tinku-bat','pratham-tinku-fox','pratham-tinku-owl','pratham-tinku-sleep','pratham-moru-numbers','pratham-zoo-visit','pratham-zoo-monkeys','pratham-zoo-family']){
    const media=getMashaalWebMedia(key);
    assert.ok(media,key);
    assert.match(media.url,/^assets\/oer\/pratham\/\d{4}\/\d{2}\.jpg$/);
    assert.equal(media.license,'CC BY 4.0');
  }
});

test('thirteen Pratham-backed games are source tagged',async()=>{
  const { getMashaalKg3Activity }=await import('../src/modules/mashaal/curriculum/kg3-activity-catalog.js');
  for(const id of ['kg3-open-nature-memory-01','kg3-open-tree-cycle-01','kg3-open-colors-nature-01','kg3-open-seed-journey-01','kg3-open-nature-puzzle-01','kg3-open-tinku-night-01','kg3-open-moru-puzzle-01','kg3-open-zoo-find-01','kg3-open-zoo-memory-01','kg3-open-zoo-puzzle-01','kg3-open-tree-puzzle-bank-01','kg3-open-seed-puzzle-bank-01','kg3-open-tinku-puzzle-bank-01']){
    const activity=getMashaalKg3Activity(id);
    assert.ok(activity,id);
    assert.equal(activity.assetSourceId,'storyweaver-ccby');
    assert.ok(['0433','0352','0071','0056','0006','0120'].includes(activity.assetPackId));
  }
});
