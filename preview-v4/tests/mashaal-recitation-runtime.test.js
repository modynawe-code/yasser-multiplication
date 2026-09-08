import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';
import { validateMashaalRecitationActivity } from '../src/modules/mashaal/application/recitation-release-validator.js';
import { getMashaalRecitationMediaStatus } from '../src/modules/mashaal/curriculum/recitation-source-registry.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('recitation runtime opens only when integrity-verified local human audio exists',()=>{
  const media=getMashaalRecitationMediaStatus();
  const plan=createMashaalActivityPlan('listen-repeat');
  assert.equal(plan.contentReady,media.localMediaReady);
  assert.equal(plan.activities.length,media.localMediaReady?1:0);
  if(media.localMediaReady){
    const activity=plan.activities[0];
    assert.equal(activity.syntheticRecitationAllowed,false);
    assert.equal(activity.stimulus.surahNumber,112);
    assert.match(activity.mediaPath,/^\.\/assets\/recitation\/.*\.mp3$/);
    assert.match(activity.mediaSha256,/^[a-f0-9]{64}$/);
    assert.equal(activity.mushafPage.pageNumber,604);
    assert.match(activity.mushafPage.imageUrl,/quranpedia\/quran-svg\/main\/mushafs\/hafs\/kfqc\/svg\/604\.svg$/);
    assert.equal(activity.mushafPage.focusRegion.surahNumber,112);
    assert.ok(activity.mushafPage.focusRegion.height>0&&activity.mushafPage.focusRegion.height<1);
  }
});

test('recitation view model carries human audio and verified Mushaf artwork separately from spoken instructions',()=>{
  const model=createMashaalActivityViewModel({
    id:'recitation-demo',skillId:'listen-repeat',interaction:'listening',evidenceType:'activity-completion',
    promptAr:'اسمعي ثم رددي.',audioPromptAr:'اضغطي تشغيل ثم رددي بعد القارئ.',
    stimulus:{kind:'recitation-audio',surahNameAr:'الإخلاص',surahNumber:112},choices:['done'],mediaPath:'./assets/recitation/demo.mp3',
    mushafPage:{sourceId:'kfgqpc-hafs-madinah-svg',pageNumber:604,imageUrl:'https://example.test/604.svg'}
  });
  assert.equal(model.requiresHumanRecitation,true);
  assert.equal(model.recitationAudioPath,'./assets/recitation/demo.mp3');
  assert.equal(model.stimulus.kind,'recitation');
  assert.equal(model.stimulus.surahNameAr,'الإخلاص');
  assert.equal(model.recitationMushafPage.pageNumber,604);
  assert.equal(model.completionOnly,true);
});

test('recitation validator rejects media that is not present in the verified manifest',()=>{
  const result=validateMashaalRecitationActivity({skillId:'listen-repeat',mediaAssetId:'missing',mediaSourceId:'kfgqpc-ibrahim-al-akhdar-hafs',syntheticRecitationAllowed:false});
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('approved-recitation-media-required'));
});

test('reusable Quran player exposes explicit play pause and restart controls without Quran TTS',async()=>{
  const player=await read('src/modules/mashaal/quran/quran-surah-player.js');
  assert.match(player,/تشغيل/);
  assert.match(player,/إيقاف مؤقت/);
  assert.match(player,/من البداية/);
  assert.match(player,/audio\.play\(\)/);
  assert.match(player,/audio\.pause\(\)/);
  assert.match(player,/audio\.currentTime=0/);
  assert.match(player,/normalizedFocusRegion/);
  assert.match(player,/focusRegion\.top\*100/);
  assert.doesNotMatch(player,/speechSynthesis|SpeechSynthesisUtterance|createSpeechService/);
});

test('Quran player presentation keeps KG3 controls large and uses a clipped official-page viewport',async()=>{
  const css=await read('src/modules/mashaal/quran/quran-surah-player.css');
  assert.match(css,/\.quran-page-viewport\{position:relative;overflow:hidden/);
  assert.match(css,/\.quran-control\{min-height:72px/);
  assert.match(css,/grid-template-columns:minmax\(330px,390px\)/);
});

test('Mashaal controller delegates Quran recitation to reusable player and only speaks instructions',async()=>{
  const controller=await read('src/modules/mashaal/ui/mashaal-controller.js');
  assert.match(controller,/mountQuranSurahPlayer/);
  assert.match(controller,/recitationMushafPage/);
  assert.match(controller,/recitationPlayed=true/);
  assert.match(controller,/اسمعي التلاوة كاملة أولًا/);
  assert.doesNotMatch(controller,/new Audio\(/);
});

test('service worker caches the Quran player and runtime-caches only the verified KFGQPC Hafs SVG path',async()=>{
  const worker=await read('service-worker.js');
  assert.match(worker,/modules\/mashaal\/quran\/quran-surah-player\.js/);
  assert.match(worker,/modules\/mashaal\/quran\/quran-surah-player\.css/);
  assert.match(worker,/quranpedia\/quran-svg\/main\/mushafs\/hafs\/kfqc\/svg/);
  assert.match(worker,/isVerifiedQuranPageImage/);
});
