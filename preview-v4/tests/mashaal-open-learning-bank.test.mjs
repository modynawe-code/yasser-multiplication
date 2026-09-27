import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_OPEN_LEARNING_SOURCES,getMashaalOpenLearningSource } from '../src/modules/mashaal/curriculum/open-learning-source-registry.js';
import { MASHAAL_OPEN_ACTIVITY_BANK,listMashaalOpenActivitiesBySource } from '../src/modules/mashaal/curriculum/open-learning-activity-bank.js';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';

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
  for(const key of ['duck','dog','parrot','cow','frog','owl']){
    const media=getMashaalWebMedia(key);
    assert.ok(media);
    assert.match(media.url,/^assets\/oer\/kenney\/animals\//);
    assert.equal(media.license,'CC0 1.0');
    assert.equal(media.source,'Kenney Animal Pack Remastered');
  }
});
