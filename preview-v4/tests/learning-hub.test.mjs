import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('main composes Yasser, Khaled, Mashaal and games without replacing learner controllers',async()=>{
  const main=await read('src/main.js');
  for(const token of ['createAppController','createKhaledController','createMashaalController','createGamesController','createHubController','createLearnerRuntimeRegistry','createFamilyParentController','ensureLearningShell','ensureMashaalShell'])assert.match(main,new RegExp(token));
});

test('hub preserves approved Yasser and Khaled routes and hydrates future learners generically',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const registry=await read('src/modules/hub/learner-hub-registry.js');
  assert.match(shell,/id="hubYasser"/);
  assert.match(shell,/id="hubKhaled"/);
  assert.match(shell,/جدول الضرب 1–10/);
  assert.match(shell,/رياضيات أول ابتدائي/);
  assert.match(shell,/أعداد • عمليات • قياس • أشكال • نقود/);
  assert.match(registry,/listLearnerProfiles/);
  assert.match(registry,/data-learner-id/);
  assert.doesNotMatch(shell,/صور خالد ستضاف لاحقًا/);
});

test('switching learners closes active module state through the generic runtime and preserves one active view',async()=>{
  const main=await read('src/main.js');
  const hub=await read('src/modules/hub/hub-controller.js');
  const yasser=await read('src/ui/app-controller.js');
  assert.match(hub,/onBeforeShow\?\.\(\)/);
  assert.match(hub,/onAfterShow\?\.\(\)/);
  assert.match(main,/learnerRuntimes\.leaveAll\(\)/);
  assert.match(main,/leaveLearningAreas\(\)/);
  assert.match(main,/games\?\.leave\(\)/);
  assert.match(main,/mashaal\.leave\(\)/);
  assert.match(main,/familyParent\.leave\(\)/);
  assert.match(yasser,/all\('\.view'\)\.forEach/);
  assert.match(yasser,/session\.completed=true/);
  assert.match(yasser,/enterHome:goHome/);
  assert.match(yasser,/\n    leave,/);
});

test('Khaled mode keeps the latest games-platform visuals and preserves incomplete sessions',async()=>{
  const css=await read('src/modules/hub/learning-hub.css');
  const homeCss=await read('src/modules/khaled/ui/khaled-home.css');
  const khaled=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(css,/body\.khaled-mode \.topbar/);
  assert.match(homeCss,/khaled-home/);
  assert.match(khaled,/classList\.add\('khaled-mode'\)/);
  assert.match(khaled,/classList\.remove\('khaled-mode'\)/);
  assert.match(khaled,/session\.completed=true/);
  assert.match(khaled,/storeSession\(\{incomplete:true\}\)/);
  assert.match(khaled,/visuals\.question\(\)/);
  assert.match(khaled,/visuals\.result\(summary\.masteryScore\)/);
});

test('Khaled UI keeps core activities inline and delegates modular learning families',async()=>{
  const hubCss=await read('src/modules/hub/learning-hub.css');
  const khaled=await read('src/modules/khaled/ui/khaled-controller.js');
  const addition=await read('src/modules/khaled/ui/khaled-addition-renderer.js');
  const advanced=await read('src/modules/khaled/ui/khaled-advanced-renderer.js');
  assert.match(khaled,/question\.type==='number-order'/);
  assert.match(khaled,/isAdditionQuestion\(question\)/);
  assert.match(khaled,/isAdvancedQuestion\(question\)/);
  assert.match(addition,/visual-addition/);
  assert.match(advanced,/isMoneyQuestion/);
  assert.match(hubCss,/\.khaled-number-line/);
  assert.match(hubCss,/\.khaled-dot-group\.large/);
});

test('offline shell includes games, open-family runtime, Mashaal, Khaled and parent modules',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/games/games-controller.js','modules/hub/hub-controller.js','modules/hub/learning-shell.js','modules/khaled/domain/curriculum.js','modules/khaled/ui/khaled-controller.js','modules/parent/family-parent-controller.js','shared/audio/speech-service.js'])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
