import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Yasser home is composed from a dedicated learner presentation module before controllers bind',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/import \{ ensureYasserHomeShell \} from '\.\/modules\/yasser\/ui\/yasser-home-shell\.js'/);
  assert.ok(main.indexOf('ensureYasserHomeShell();')<main.indexOf('ensureLearningShell();'));
  assert.match(main,/motivationAnchor:'#homeView \.yasser-home-focus'/);
});

test('index keeps only the Yasser home mount point so presentation markup has one source of truth',async()=>{
  const html=await read('index.html');
  assert.match(html,/<title>تعلم العائلة<\/title>/);
  assert.match(html,/<section id="homeView" class="view"><\/section>/);
  assert.doesNotMatch(html,/class="home-grid"/);
  assert.doesNotMatch(html,/class="card parent-summary"/);
  assert.doesNotMatch(html,/id="homeYasser"/);
});

test('Yasser learner home has one mission surface and no parent-report sidebar contract',async()=>{
  const shell=await read('src/modules/yasser/ui/yasser-home-shell.js');
  assert.match(shell,/home\.dataset\.presentation==='yasser-home-v2'/);
  assert.match(shell,/class="yasser-home-hero"/);
  assert.match(shell,/class="yasser-home-training"/);
  assert.match(shell,/id="tableSelector"/);
  assert.match(shell,/id="startPractice"/);
  assert.match(shell,/id="startLearn"/);
  assert.match(shell,/id="startExam"/);
  assert.match(shell,/id="homeYasser"/);
  assert.match(shell,/id="homeAssistant"/);
  assert.doesNotMatch(shell,/parent-summary/);
  assert.doesNotMatch(shell,/smart-note/);
});

test('Yasser keeps child-facing progress compact without moving the parent report back into home',async()=>{
  const shell=await read('src/modules/yasser/ui/yasser-home-shell.js');
  const css=await read('src/modules/yasser/ui/yasser-home.css');
  for(const id of ['miniAttempts','miniErrors','progressList','focusSummary'])assert.match(shell,new RegExp(`id="${id}"`));
  assert.match(css,/\.yasser-home-progress-grid\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/\.yasser-home-progress-metrics\{display:grid;grid-template-columns:1fr 1fr/);
});

test('Yasser home owns explicit Galaxy Tab landscape and narrow-screen layout rules',async()=>{
  const css=await read('src/modules/yasser/ui/yasser-home.css');
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:850px\)/);
  assert.match(css,/\.yasser-home-panel\{grid-template-columns:minmax\(0,1\.08fr\) minmax\(430px,\.92fr\)/);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:850px\) and \(max-height:720px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/@media\(max-width:430px\)/);
});

test('dedicated Yasser home presentation is part of the offline application shell',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/src\/modules\/yasser\/ui\/yasser-home-shell\.js/);
  assert.match(worker,/src\/modules\/yasser\/ui\/yasser-home\.css/);
  assert.match(worker,/shell-73/);
});
