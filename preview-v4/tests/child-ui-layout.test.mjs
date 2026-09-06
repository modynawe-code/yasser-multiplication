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

test('learner chooser has a dedicated short-landscape contract so its heading is never centered offscreen',async()=>{
  const css=await read('src/modules/hub/learning-hub.css');
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:850px\) and \(max-height:720px\)/);
  assert.match(css,/\.learner-hub\{min-height:0;justify-content:flex-start/);
  assert.match(css,/\.learner-card\{min-height:350px;grid-template-rows:230px auto/);
});

test('Khaled has a dedicated intro route without merging his curriculum into Yasser flow',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  const scenes=await read('src/modules/khaled/ui/khaled-scene-controller.js');
  const css=await read('src/modules/hub/learning-hub.css');
  assert.match(shell,/id="khaledIntroView"/);
  assert.match(shell,/id="khaledIntroStart"[^>]*>يلا نبدأ<\/button>/);
  assert.match(controller,/function showIntro\(\)/);
  assert.match(controller,/function enterHome\(\)/);
  assert.match(controller,/return\{start\(\)\{bind\(\);visuals\.warm\(\);showIntro\(\);\},enter\(\)\{bind\(\);visuals\.warm\(\);enterHome\(\);\}/);
  assert.match(scenes,/function intro\(\)\{return paint\('intro','groupThinking'\);\}/);
  assert.match(css,/\.khaled-intro-shell/);
});

test('Khaled question character and task content occupy explicit physical grid regions',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const css=await read('src/modules/hub/learning-hub.css');
  assert.match(shell,/khaled-session-character[\s\S]*khaled-question-content/);
  assert.match(css,/\.khaled-question-card\{[^}]*direction:ltr[^}]*grid-template-areas:"guide task"/);
  assert.match(css,/\.khaled-session-character\{grid-area:guide;direction:rtl/);
  assert.match(css,/\.khaled-question-content\{grid-area:task;direction:rtl/);
  assert.match(css,/--khaled-guide-column:minmax\(220px,31%\)/);
  assert.match(css,/grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\)/);
});

test('Khaled device hardening constrains viewport without overriding shared column ownership',async()=>{
  const hardening=await read('src/modules/khaled/ui/khaled-device-hardening.css');
  const characters=await read('src/modules/khaled/ui/khaled-character-system.css');
  assert.doesNotMatch(hardening,/khaled-question-card\{[^}]*grid-template-columns:/);
  assert.doesNotMatch(hardening,/khaled-session-character\{[^}]*max-height:/);
  assert.match(characters,/\.khaled-session-character\{[^}]*aspect-ratio:4\/3[^}]*overflow:hidden/);
  assert.match(characters,/\.khaled-character-fallback\[hidden\][^}]*display:none!important/);
  assert.match(hardening,/\.khaled-intro-character\{[^}]*aspect-ratio:4\/3[^}]*height:auto/);
});

test('Khaled renderer exposes semantic question type for activity-specific responsive layouts',async()=>{
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  const money=await read('src/modules/khaled/ui/khaled-money.css');
  assert.match(controller,/card\.dataset\.questionType=question\.type\|\|'default'/);
  for(const type of ['money-recognition','count-money','money-model','equal-money-amounts','use-money'])assert.match(money,new RegExp(`data-question-type="${type}"`));
  assert.match(money,/money-model[\s\S]*grid-template-columns:repeat\(3,minmax\(160px,1fr\)\)/);
  assert.match(money,/equal-money-amounts[\s\S]*grid-template-columns:repeat\(2,minmax\(150px,1fr\)\)/);
});

test('Yasser practice uses a height-aware side-by-side question scene in landscape',async()=>{
  const css=await read('src/ui/styles/character-system.css');
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:760px\)/);
  assert.match(css,/grid-template-areas:[\s\S]*"streak visual"[\s\S]*"question visual"[\s\S]*"answers visual"/);
  assert.match(css,/\.question-card:not\(\.exam-mode\) \.session-visuals\{grid-area:visual/);
});

test('Yasser intro and result use height-aware landscape layouts rather than forcing vertical scroll',async()=>{
  const css=await read('src/ui/styles/character-system.css');
  assert.match(css,/\.result-card\{[\s\S]*grid-template-areas:[\s\S]*"kicker visual"[\s\S]*"weak weak"[\s\S]*"actions actions"/);
  assert.match(css,/@media \(orientation:landscape\) and \(min-width:850px\) and \(max-height:720px\)\{[\s\S]*\.intro-shell\{min-height:0;padding:8px 0 14px\}/);
});

test('Yasser home prioritizes the learning mission over the progress sidebar and uses dynamic viewport height',async()=>{
  const css=await read('style.css');
  assert.match(css,/\.home-grid\{[^}]*grid-template-columns:minmax\(0,1\.45fr\) minmax\(280px,\.55fr\)/);
  assert.match(css,/body\{min-height:100dvh\}/);
  assert.match(css,/\.mission,\.parent-summary\{min-height:calc\(100dvh - 96px\)/);
  assert.match(css,/\.icon-btn\{min-height:48px/);
});

test('character scale distinguishes chooser, intro, review, practice, and result roles',async()=>{
  const scale=await read('src/ui/styles/character-scale.css');
  for(const token of ['--character-yasser-hub','--character-yasser-learn','--character-yasser-session','--character-yasser-result','--character-khaled-hub','--character-khaled-intro','--character-khaled-session','--character-khaled-result'])assert.match(scale,new RegExp(token));
  assert.match(scale,/--character-khaled-session:180px/);
});

test('strong Khaled round completion exposes the approved group celebration',async()=>{
  const scenes=await read('src/modules/khaled/ui/khaled-scene-controller.js');
  const controller=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(scenes,/if\(pct>=80\)return paint\('result','groupCelebration'/);
  assert.match(controller,/pct>=80\?'أبدعت يا خالد/);
});
