import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createFamilyParentReportCapabilityRegistry } from '../src/modules/parent/family-parent-report-capabilities.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('family report is wired from main through learner report capabilities instead of named state getters',async()=>{
  const main=await read('src/main.js'),controller=await read('src/modules/parent/family-parent-controller.js');
  assert.match(main,/createFamilyParentController/);
  assert.match(main,/createFamilyParentReportCapabilityRegistry/);
  for(const learner of ['yasser','khaled','mashaal'])assert.match(main,new RegExp(`parentReportCapabilities\\.register\\('${learner}'`));
  assert.match(main,/reportCapabilities:parentReportCapabilities/);
  assert.doesNotMatch(controller,/getYasserState|getKhaledState|getMashaalState/);
  assert.match(main,/familyParent\.start\(\)/);
});

test('parent report capability registry keeps stage-specific report types without fixed child-count assumptions',()=>{
  const registry=createFamilyParentReportCapabilityRegistry();
  const render=()=>'<p>report</p>',overview=()=>'<p>overview</p>',sessions=()=>[];
  registry.register('yasser',{getState:()=>({id:'y'}),renderReport:render,renderOverview:overview,listSessions:sessions,reportType:'academic'});
  registry.register('mashaal',{getState:()=>({id:'m'}),renderReport:render,renderOverview:overview,listSessions:sessions,reportType:'developmental'});
  assert.equal(registry.get('yasser')?.reportType,'academic');
  assert.equal(registry.get('mashaal')?.reportType,'developmental');
  assert.deepEqual(Object.keys(registry.exportStates()),['yasser','mashaal']);
  assert.equal(registry.list().length,2);
});

test('family shell keeps only structural report tabs and hydrates every registered learner dynamically',async()=>{
  const shell=await read('src/modules/hub/learning-shell.js');
  const registry=await read('src/modules/parent/family-parent-shell-registry.js');
  assert.match(shell,/id="familyParentBtn"/);
  assert.match(shell,/id="familyParentView"/);
  for(const tab of ['overview','sessions'])assert.match(shell,new RegExp(`data-family-parent-tab="${tab}"`));
  assert.doesNotMatch(shell,/data-family-parent-tab="yasser"|data-family-parent-tab="khaled"|data-family-parent-tab="mashaal"/);
  assert.match(registry,/listLearnerProfiles/);
  assert.match(registry,/data-family-parent-tab/);
  assert.match(registry,/profile\.displayName/);
  assert.match(shell,/modal\.id='familyPinModal'/);
  assert.match(shell,/id="familyPinInput"/);
  assert.match(shell,/عرض تقدم الأطفال/);
});

test('family renderers preserve academic metrics and developmental reporting while exposing generic composition functions',async()=>{
  const renderers=await read('src/modules/parent/family-parent-renderers.js');
  assert.match(renderers,/summarizeLearningWindows/);
  assert.match(renderers,/summarizeLearningAttempts/);
  assert.match(renderers,/KHALED_SKILLS/);
  assert.match(renderers,/buildMashaalParentSummary/);
  assert.match(renderers,/familyOverviewEntries/);
  assert.match(renderers,/familySessionEntries/);
  assert.match(renderers,/familyGenericOverview/);
  assert.match(renderers,/familyGenericSessions/);
  assert.match(renderers,/الأخطاء التاريخية/);
  assert.match(renderers,/صح من أول مرة/);
  assert.match(renderers,/النجاح النهائي/);
  assert.match(renderers,/التقييم نمائي/);
  assert.match(renderers,/sort\(\(a,b\)=>new Date\(b\.at\)-new Date\(a\.at\)\)/);
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

test('family report exports registered learner states without spelling child names into the controller',async()=>{
  const controller=await read('src/modules/parent/family-parent-controller.js');
  assert.match(controller,/family-learning-backup/);
  assert.match(controller,/reportCapabilities\?\.exportStates\?\.\(\)/);
  assert.doesNotMatch(controller,/yasser:getYasserState|khaled:getKhaledState|mashaal:getMashaalState/);
  assert.match(controller,/family-learning-results/);
});

test('offline shell caches parent report capability registry',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/src\/modules\/parent\/family-parent-report-capabilities\.js/);
  assert.match(worker,/shell-\d+/);
});
