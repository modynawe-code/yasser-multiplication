import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';
import { validateMashaalRecitationActivity } from '../src/modules/mashaal/application/recitation-release-validator.js';

test('recitation remains closed while no integrity-verified local audio asset exists',()=>{
  const plan=createMashaalActivityPlan('listen-repeat');
  assert.equal(plan.contentReady,false);
  assert.equal(plan.activities.length,0);
});

test('recitation view model carries a local human-audio path separately from TTS instructions',()=>{
  const model=createMashaalActivityViewModel({
    id:'recitation-demo',skillId:'listen-repeat',interaction:'listening',evidenceType:'activity-completion',
    promptAr:'اسمعي ثم رددي.',audioPromptAr:'اضغطي زر الاستماع ثم رددي بعد القارئ.',
    stimulus:{kind:'recitation-audio',surahNameAr:'سورة قصيرة'},choices:['done'],mediaPath:'./assets/recitation/demo.mp3'
  });
  assert.equal(model.requiresHumanRecitation,true);
  assert.equal(model.recitationAudioPath,'./assets/recitation/demo.mp3');
  assert.equal(model.stimulus.kind,'recitation');
  assert.equal(model.completionOnly,true);
});

test('recitation validator rejects media that is not present in the verified manifest',()=>{
  const result=validateMashaalRecitationActivity({skillId:'listen-repeat',mediaAssetId:'missing',mediaSourceId:'kfgqpc-ibrahim-al-akhdar-hafs',syntheticRecitationAllowed:false});
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('approved-recitation-media-required'));
});

test('Mashaal controller never uses TTS as Quran recitation audio',async()=>{
  const controller=await readFile(new URL('../src/modules/mashaal/ui/mashaal-controller.js',import.meta.url),'utf8');
  assert.match(controller,/new Audio\(currentViewModel\.recitationAudioPath\)/);
  assert.match(controller,/requiresHumanRecitation/);
  assert.match(controller,/recitationPlayed/);
  assert.match(controller,/اسمعي التلاوة أولًا/);
  assert.match(controller,/if\(currentViewModel\.requiresHumanRecitation\)\{void playCurrentRecitation\(\);return;\}/);
});
