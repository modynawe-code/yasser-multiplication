import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readPreview=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Mashaal tablet CSS preserves explicit landscape, portrait/narrow and reduced-motion contracts',async()=>{
  const css=await readPreview('src/modules/mashaal/ui/mashaal.css');
  assert.match(css,/@media\(min-width:900px\) and \(orientation:landscape\) and \(max-height:900px\)/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(max-width:430px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.mashaal-wrap\{max-width:1120px;/);
  assert.match(css,/\.mashaal-domain-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:760px\)\{\.mashaal-domain-grid\{grid-template-columns:repeat\(2,1fr\)\}/);
  assert.match(css,/\.mashaal-skill-grid\{width:100%;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:760px\).*\.mashaal-skill-grid\{grid-template-columns:1fr\}/s);
});

test('Mashaal child controls keep large touch targets and visible non-color-only interaction states',async()=>{
  const css=await readPreview('src/modules/mashaal/ui/mashaal.css');
  assert.match(css,/\.mashaal-hear\{width:60px;height:60px;min-width:60px;min-height:60px/);
  assert.match(css,/\.mashaal-domain-actions \.icon-btn\{min-height:52px/);
  assert.match(css,/\.mashaal-choice\{min-height:92px/);
  assert.match(css,/\.mashaal-check\{min-width:190px;margin-top:18px;min-height:60px/);
  assert.match(css,/\.mashaal-choice\.selected,\.mashaal-choice\[aria-pressed="true"\]\{border-width:4px/);
  assert.match(css,/focus-visible\{outline:4px solid/);
  assert.match(css,/\.mashaal-skill-card:disabled::after\{content:"🔒"/);
});

test('Mashaal shell exposes the three visual QA surfaces and accessible live feedback',async()=>{
  const shell=await readPreview('src/modules/mashaal/ui/mashaal-shell.js');
  for(const id of ['mashaalHomeView','mashaalDomainView','mashaalActivityView','mashaalDomainGrid','mashaalSkillGrid','mashaalActivityChoices'])assert.match(shell,new RegExp(`id=\\"${id}\\"`));
  assert.match(shell,/id="mashaalHomeStatus"[^>]*aria-live="polite"|aria-live="polite"[^>]*id="mashaalHomeStatus"/);
  assert.match(shell,/id="mashaalActivityFeedback"[^>]*aria-live="polite"|aria-live="polite"[^>]*id="mashaalActivityFeedback"/);
  assert.match(shell,/aria-label="اسمعي التعليمات"/);
  assert.match(shell,/aria-label="اسمعي السؤال"/);
});
