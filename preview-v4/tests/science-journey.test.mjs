import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const journey=await readFile(new URL('../src/modules/yasser/science/science-journey.js',import.meta.url),'utf8');
const css=await readFile(new URL('../src/modules/yasser/science/science-journey.css',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('science journey keeps the real current curriculum path',()=>{
  assert.match(journey,/الوحدة الأولى/);
  assert.match(journey,/الوحدة الثانية/);
  assert.match(journey,/الوحدة الثالثة/);
  assert.match(journey,/الفصل الخامس/);
  assert.match(journey,/الفصل السادس/);
  assert.match(journey,/المحطة القادمة/);
  assert.match(journey,/تحدي خبير الأنظمة البيئية/);
  assert.match(journey,/disabled:true/);
});

test('science journey has child-friendly responsive and reduced-motion styling',()=>{
  assert.match(css,/science-journey-path/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/prefers-reduced-motion/);
});

test('science journey exposes real quick and image actions',()=>{
  assert.match(journey,/data-journey-mode=\"quick\"/);
  assert.match(journey,/data-journey-mode=\"images\"/);
});

test('science journey module is loaded by the preview shell',()=>{
  assert.match(index,/science-journey\.js/);
});
