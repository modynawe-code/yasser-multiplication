import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';
import { getMashaalKg3Activity } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';

const LOCAL_SCENARIOS=[
  'doctor','teacher','baker','wait-turn','grab-ball','ask-help',
  'return-book','leave-book-floor','damage-book','duck','apple','moon',
  'compare-three-apples','compare-four-apples','compare-five-apples',
  'healthy-apple','candy','fries'
];

const EMBEDDED_SCENARIOS=[
  'wet-hands','soap','rub-hands','rinse-hands',
  'hot-surface','stay-away','touch-hot','play-near-hot',
  'playtime-cleanup','help-tidy','leave-mess','scatter-toys',
  'girl-lost-toy','happy','sad','angry',
  'rainy-day','umbrella','sunglasses','ball',
  'fallen-block-tower','throw-blocks','kick-blocks',
  'ball-above-box','ball-inside-box','ball-below-box',
  'wake','brush-teeth','breakfast'
];

const COMPLETED_ACTIVITY_IDS=[
  'kg3-handwashing-sequence-01',
  'kg3-personal-safety-01',
  'kg3-family-community-01',
  'kg3-recognize-emotion-01',
  'kg3-observe-reason-01',
  'kg3-seek-help-01',
  'kg3-spatial-position-01',
  'kg3-story-sequence-01'
];

const isOfflineArtwork=(media)=>Boolean(media)&&(
  /^assets\/mashaal\/choices\/[a-z0-9-]+\.webp$/.test(media.url)||
  /^data:image\/svg\+xml;charset=utf-8,/.test(media.url)
);

test('Mashaal scenario choices prefer committed local artwork',()=>{
  for(const key of LOCAL_SCENARIOS){
    const media=getMashaalWebMedia(key);
    assert.ok(media,`${key} media exists`);
    assert.match(media.url,/^assets\/mashaal\/choices\/[a-z0-9-]+\.webp$/);
  }
});

test('remaining KG3 scenes use embedded local illustrations instead of web icons',()=>{
  for(const key of EMBEDDED_SCENARIOS){
    const media=getMashaalWebMedia(key);
    assert.ok(media,`${key} media exists`);
    assert.match(media.url,/^data:image\/svg\+xml;charset=utf-8,/);
    assert.equal(media.source,'Mashaal local SVG scene');
    assert.doesNotMatch(media.url,/cdn\.jsdelivr\.net/);
  }
});

test('the eight completed KG3 activities cannot regress to simple or web fallback visuals',()=>{
  for(const activityId of COMPLETED_ACTIVITY_IDS){
    const activity=getMashaalKg3Activity(activityId);
    assert.ok(activity,`${activityId} exists`);
    for(const key of activity.choices||[]){
      const media=getMashaalWebMedia(key);
      assert.ok(isOfflineArtwork(media),`${activityId}:${key} must have offline illustrated media`);
    }
    if(activity.stimulus?.kind==='picture-scene'){
      const sceneMedia=getMashaalWebMedia(activity.stimulus.scene);
      assert.ok(isOfflineArtwork(sceneMedia),`${activityId}:${activity.stimulus.scene} prompt must use offline scene art`);
    }
  }
});

test('national flags keep exact source-backed assets instead of generated flag art',()=>{
  for(const key of ['saudi-flag','japan-flag','brazil-flag']){
    const media=getMashaalWebMedia(key);
    assert.ok(media);
    assert.match(media.url,/flag-icons@7\.3\.2/);
  }
});
