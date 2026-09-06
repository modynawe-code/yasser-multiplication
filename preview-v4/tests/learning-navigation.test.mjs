import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Khaled learning flow exposes intro, skill-back, and learner-home navigation',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  assert.match(shell,/id="khaledIntroStart"[^>]*>ابدأ التعلم<\/button>/);
  assert.match(shell,/id="khaledHomeToHub"[^>]*>اختيار الطفل<\/button>/);
  assert.match(shell,/id="khaledExitSession"[^>]*>رجوع للمهارات<\/button>/);
  assert.match(shell,/id="khaledSessionToHub"[^>]*>اختيار الطفل<\/button>/);
  assert.match(shell,/id="khaledResultToHub"[^>]*>اختيار الطفل<\/button>/);
});

test('cross-learner Khaled exits are wired only at the composition root',async()=>{
  const main=await read('src/main.js');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  const hub=await read('src/modules/hub/hub-controller.js');
  assert.match(main,/function exitKhaledToHub\(\)\{\s*khaled\.leave\(\);hub\?\.show\(\);\s*\}/);
  assert.match(main,/\['khaledHomeToHub','khaledSessionToHub','khaledResultToHub'\]/);
  assert.doesNotMatch(controller,/khaledSessionToHub/);
  assert.doesNotMatch(controller,/khaledResultToHub/);
  assert.match(controller,/function exitSession\(\)\{leave\(\);enterHome\(\);\}/);
  assert.match(controller,/storeSession\(\{incomplete:true\}\)/);
  assert.match(hub,/classList\.remove\('intro-mode','family-parent-mode','khaled-mode'\)/);
});

test('shared navigation controls keep a child-friendly touch target',async()=>{
  const css=await read('src/ui/styles/learning-navigation.css');
  assert.match(css,/min-height:48px/);
  assert.match(css,/\.learning-nav-actions/);
});
