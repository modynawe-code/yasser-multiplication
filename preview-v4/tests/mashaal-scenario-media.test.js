import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';

const LOCAL_SCENARIOS=[
  'doctor','teacher','baker','wait-turn','grab-ball','ask-help',
  'return-book','leave-book-floor','damage-book','duck','apple','moon',
  'compare-three-apples','compare-four-apples','compare-five-apples',
  'healthy-apple','candy','fries'
];

test('Mashaal scenario choices prefer committed local artwork',()=>{
  for(const key of LOCAL_SCENARIOS){
    const media=getMashaalWebMedia(key);
    assert.ok(media,`${key} media exists`);
    assert.match(media.url,/^assets\/mashaal\/choices\/[a-z0-9-]+\.webp$/);
  }
});

test('national flags keep exact source-backed assets instead of generated flag art',()=>{
  for(const key of ['saudi-flag','japan-flag','brazil-flag']){
    const media=getMashaalWebMedia(key);
    assert.ok(media);
    assert.match(media.url,/flag-icons@7\.3\.2/);
  }
});
