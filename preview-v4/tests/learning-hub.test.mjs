import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('main bootstraps open family hub without replacing existing learner controllers',async()=>{
  const main=await read('src/main.js');
  for(const token of ['createAppController','createHubController','createKhaledController','createMashaalController','createFamilyParentController','ensureLearningShell','ensureMashaalShell','hydrateLearnerHub'])assert.match(main,new RegExp(token));
});

test('learner hub preserves Yasser and Khaled cards and adds registered learners generically',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const registry=await read('src/modules/hub/learner-hub-registry.js');
  const learners=await read('src/shared/learners/learner-registry.js');
  assert.match(shell,/id="hubYasser"/);assert.match(shell,/id="hubKhaled"/);
  assert.match(registry,/listLearnerProfiles/);
  assert.match(registry,/createGenericCard/);
  assert.match(registry,/dataset\.learnerId=profile\.id/);
  assert.match(learners,/mashaal:Object\.freeze/);
  assert.match(learners,/روضة ثالثة/);
  assert.doesNotMatch(shell,/assets\/.*khaled.*\.(png|webp)/i);
});

test('switching learners closes active module state and leaves one active view',async()=>{
  const main=await read('src/main.js');
  const hub=await read('src/modules/hub/hub-controller.js');
  const yasser=await read('src/ui/app-controller.js');
  assert.match(hub,/onBeforeShow\?\.\(\)/);
  assert.match(hub,/onAfterShow\?\.\(\)/);
  assert.match(hub,/\[data-learner-id\]/);
  assert.match(main,/onSelectLearner:enterLearner/);
  assert.match(main,/yasser\.leave\(\)/);
  assert.match(main,/khaled\.leave\(\)/);
  assert.match(main,/mashaal\.leave\(\)/);
  assert.match(main,/familyParent\.leave\(\)/);
  assert.match(main,/classList\.remove\('hub-mode','khaled-mode','mashaal-mode','family-parent-mode'\)/);
  assert.match(yasser,/all\('\.view'\)\.forEach/);
  assert.match(yasser,/session\.completed=true/);
  assert.match(yasser,/enterHome:goHome/);
  assert.match(yasser,/\n    leave,/);
});

test('Mashaal route is audio-first and opens only skills with verified activity content',async()=>{
  const controller=await read('src/modules/mashaal/ui/mashaal-controller.js');
  const shell=await read('src/modules/mashaal/ui/mashaal-shell.js');
  const curriculum=await read('src/modules/mashaal/curriculum/kg3-curriculum.js');
  const activityPlan=await read('src/modules/mashaal/application/activity-plan.js');
  assert.match(controller,/createSpeechService/);
  assert.match(controller,/getMashaalHomeDomains/);
  assert.match(controller,/يا مشاعل، اختاري العالم/);
  assert.match(controller,/skill\.contentReady\?'ابدئي ✨':'قريبًا'/);
  assert.match(controller,/if\(!plan\?\.contentReady\)return/);
  assert.match(shell,/id="mashaalSkillGrid"/);
  assert.match(shell,/id="mashaalActivityView"/);
  assert.match(activityPlan,/listReleasableMashaalKg3Activities/);
  assert.match(activityPlan,/contentReady:activities\.length>0/);
  assert.match(curriculum,/language-communication/);
  assert.match(curriculum,/quran-islamic-education/);
});

test('Khaled mode hides Yasser chrome and preserves incomplete sessions',async()=>{
  const css=await read('src/modules/hub/learning-hub.css');
  const khaled=await read('src/modules/khaled/ui/khaled-controller.js');
  assert.match(css,/body\.khaled-mode \.topbar/);
  assert.match(khaled,/classList\.add\('khaled-mode'\)/);
  assert.match(khaled,/classList\.remove\('khaled-mode'\)/);
  assert.match(khaled,/session\.completed=true/);
  assert.match(khaled,/storeSession\(\{incomplete:true\}\)/);
  assert.match(khaled,/visuals\.question\(\)/);
  assert.match(khaled,/visuals\.result\(pct\)/);
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

test('offline shell includes open family hub, Mashaal, Khaled, parent and speech modules',async()=>{
  const worker=await read('service-worker.js');
  for(const path of ['modules/hub/hub-controller.js','modules/hub/learner-hub-registry.js','shared/learners/learner-registry.js','modules/mashaal/ui/mashaal-controller.js','modules/mashaal/ui/mashaal.css','modules/khaled/ui/khaled-controller.js','modules/parent/family-parent-controller.js','modules/parent/family-parent-shell-registry.js','shared/audio/speech-service.js'])assert.match(worker,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
