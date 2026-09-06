import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('learner chooser uses approved Yasser artwork instead of a placeholder',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  assert.match(shell,/hub-yasser-character/);
  assert.match(shell,/assets\/visual\/original\/yasser\/welcome\.png/);
  assert.doesNotMatch(shell,/yasser-card[\s\S]*learner-placeholder[\s\S]*×/);
});

test('Khaled question character and task content occupy separate structural regions',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const css=await read('src/modules/hub/learning-hub.css');
  assert.match(shell,/khaled-session-character[\s\S]*khaled-question-content/);
  assert.match(css,/\.khaled-question-card\{[^}]*display:grid/);
  assert.match(css,/\.khaled-question-content\{[^}]*display:flex/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(180px,27%\)/);
});

test('Khaled tablet hardening never shrinks the character container with overflow-visible max-height hacks',async()=>{
  const hardening=await read('src/modules/khaled/ui/khaled-device-hardening.css');
  const characters=await read('src/modules/khaled/ui/khaled-character-system.css');
  assert.doesNotMatch(hardening,/khaled-session-character\{[^}]*max-height:/);
  assert.match(characters,/\.khaled-session-character\{[^}]*overflow:hidden/);
});

test('Yasser practice uses a height-aware side-by-side question scene in landscape',async()=>{
  const css=await read('src/ui/styles/character-system.css');
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:760px\)/);
  assert.match(css,/grid-template-areas:[\s\S]*"streak visual"[\s\S]*"question visual"[\s\S]*"answers visual"/);
  assert.match(css,/\.question-card:not\(\.exam-mode\) \.session-visuals\{grid-area:visual/);
});

test('character scale distinguishes review, practice, result, and learner chooser roles',async()=>{
  const scale=await read('src/ui/styles/character-scale.css');
  for(const token of ['--character-yasser-hub','--character-yasser-learn','--character-yasser-session','--character-yasser-result','--character-khaled-hub','--character-khaled-session','--character-khaled-result'])assert.match(scale,new RegExp(token));
});

test('strong Khaled round completion exposes the approved group celebration',async()=>{
  const scenes=await read('src/modules/khaled/ui/khaled-scene-controller.js');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(scenes,/if\(pct>=80\)return paint\('result','groupCelebration'/);
  assert.match(controller,/pct>=80\?'أبدعت يا خالد/);
});
