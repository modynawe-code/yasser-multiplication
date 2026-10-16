import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';

test('comparison group artwork uses the committed word-named apple assets',async()=>{
  for(const word of ['three','four','five']){
    const media=getMashaalWebMedia(`compare-${word}-apples`);
    assert.ok(media);
    assert.match(media.url,new RegExp(`compare-${word}-apples\\.webp$`));
  }
  const visuals=await readFile(new URL('../src/modules/mashaal/ui/mashaal-visuals.js',import.meta.url),'utf8');
  assert.match(visuals,/COUNT_WORDS/);
  assert.match(visuals,/compare-\$\{countWord\}-apples/);
});

test('choice media CSS only expands the top-level card art, not nested compact items',async()=>{
  const css=await readFile(new URL('../src/modules/mashaal/ui/mashaal-web-media.css',import.meta.url),'utf8');
  assert.match(css,/\.mashaal-choice>\.mashaal-choice-visual>\.mashaal-media-visual\{/);
  assert.doesNotMatch(css,/\.mashaal-choice \.mashaal-media-visual\{/);
});
