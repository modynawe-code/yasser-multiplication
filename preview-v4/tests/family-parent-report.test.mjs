import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('family report is wired from main with live learner state getters',async()=>{
  const main=await read('src/main.js');
  assert.match(main,/createFamilyParentController/);
  assert.match(main,/getYasserState:\(\)=>yasser\.getState\(\)/);
  assert.match(main,/getKhaledState:\(\)=>khaled\.getState\(\)/);
  assert.match(main,/getMashaalState:\(\)=>mashaal\.getState\(\)/);
  assert.match(main,/familyParent\.start\(\)/);
});

test('family shell keeps legacy tabs and hydrates registered learners without fixed child count',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const registry=await read('src/modules/parent/family-parent-shell-registry.js');
  assert.match(shell,/id="familyParentBtn"/);
  assert.match(shell,/id="familyParentView"/);
  for(const tab of ['overview','yasser','khaled','sessions'])assert.match(shell,new RegExp(`data-family-parent-tab="${tab}"`));
  assert.match(registry,/listLearnerProfiles/);
  assert.match(registry,/profile\.id/);
  assert.match(registry,/عرض تقدم الأطفال/);
  assert.match(shell,/modal\.id='familyPinModal'/);
});

test('family renderers preserve stage-specific assessment instead of forcing one scoring model',async()=>{
  const renderers=await read('src/modules/parent/family-parent-renderers.js');
  assert.match(renderers,/getOverallProgress/);
  assert.match(renderers,/KHALED_SKILLS/);
  assert.match(renderers,/familyMashaalReport/);
  assert.match(renderers,/التقييم لمشاعل نمائي وليس نسبة مئوية/);
  assert.match(renderers,/familyGenericLearnerReport/);
  assert.match(renderers,/لا يتم إسقاط تقييم مرحلة أخرى عليه/);
  assert.match(renderers,/متقن مبدئيًا/);
  assert.match(renderers,/sort\(\(a,b\)=>new Date\(b\.at\)-new Date\(a\.at\)\)/);
});

test('parent controller routes future registered learners to safe generic fallback',async()=>{
  const controller=await read('src/modules/parent/family-parent-controller.js');
  assert.match(controller,/getLearnerProfile/);
  assert.match(controller,/if\(tab==='sessions'\)return familySessions/);
  assert.match(controller,/return familyGenericLearnerReport\(getLearnerProfile\(tab\)\)/);
});

test('parent access is shared, hashed and rate limited in application code',async()=>{
  const access=await read('src/shared/security/parent-access.js');
  const yasser=await read('src/ui/app-controller.js');
  assert.match(access,/crypto\.subtle\.digest/);
  assert.match(access,/MAX_FAILURES=5/);
  assert.match(access,/LOCK_MS=30_000/);
  assert.doesNotMatch(access,/PARENT_PIN='\d+'/);
  assert.doesNotMatch(yasser,/const PARENT_PIN/);
  assert.match(yasser,/createParentAccessGate/);
});

test('family report exports one combined backup including Mashaal',async()=>{
  const controller=await read('src/modules/parent/family-parent-controller.js');
  assert.match(controller,/family-learning-backup/);
  assert.match(controller,/yasser:getYasserState\(\)/);
  assert.match(controller,/khaled:getKhaledState\(\)/);
  assert.match(controller,/mashaal:getMashaalState\(\)/);
  assert.match(controller,/family-learning-results/);
});
