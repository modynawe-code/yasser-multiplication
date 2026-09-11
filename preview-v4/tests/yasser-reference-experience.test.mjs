import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Yasser practice exposes accessible progress, feedback, and answer controls',async()=>{
  const html=await read('index.html');
  const controller=await read('src/ui/app-controller.js');

  assert.match(html,/id="sessionProgressTrack"[^>]*role="progressbar"[^>]*aria-valuenow="0"/);
  assert.match(html,/id="feedback"[^>]*role="status"[^>]*aria-live="assertive"/);
  assert.match(html,/id="answers"[^>]*role="group"[^>]*aria-label="خيارات الإجابة"/);
  assert.match(controller,/setQuestionInteraction\(false\)/);
  assert.match(controller,/sessionProgressTrack'\)\.setAttribute\('aria-valuenow'/);
  assert.match(controller,/questionCard'\)\.dataset\.feedback='correct'/);
  assert.match(controller,/questionCard'\)\.dataset\.feedback='wrong'/);
});

test('Yasser reference flow has explicit tablet portrait and landscape contracts',async()=>{
  const style=await read('style.css');
  const characters=await read('src/ui/styles/character-system.css');
  const home=await read('src/modules/yasser/ui/yasser-home.css');

  assert.match(style,/@media \(orientation:portrait\) and \(min-width:600px\) and \(max-width:900px\)/);
  assert.match(home,/@media \(orientation:portrait\) and \(min-width:600px\) and \(max-width:900px\)/);
  assert.match(characters,/grid-template-areas:[\s\S]*"streak visual"[\s\S]*"label visual"[\s\S]*"question visual"/);
  assert.match(style,/prefers-reduced-motion:reduce/);
});

test('Yasser reference copy does not use emoji as interface graphics',async()=>{
  const html=await read('index.html');
  const home=await read('src/modules/yasser/ui/yasser-home-shell.js');
  const controller=await read('src/ui/app-controller.js');
  const referenceCopy=`${html.match(/<section id="sessionView"[\s\S]*?<section id="parentView"/)?.[0]||''}${home}${controller}`;

  assert.doesNotMatch(referenceCopy,/[🔥🏆👋✓]/u);
});
