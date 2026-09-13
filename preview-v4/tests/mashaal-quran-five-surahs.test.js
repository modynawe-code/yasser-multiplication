import test from 'node:test';
import assert from 'node:assert/strict';
import { createMashaalActivityPlan } from '../src/modules/mashaal/application/activity-plan.js';
import { listMashaalRecitationChoices } from '../src/modules/mashaal/application/recitation-activity-factory.js';
import { getMashaalDomainSkills } from '../src/modules/mashaal/ui/domain-view-model.js';
import { KHALED_QURAN_TERMS } from '../src/modules/khaled/quran/khaled-quran.js';

const EXPECTED=Object.freeze([1,114,113,112,111]);

test('Mashaal exposes the same requested five-surah set used by Khaled term 1',()=>{
  const mashaal=listMashaalRecitationChoices();
  assert.deepEqual(mashaal.map(item=>item.surahNumber),EXPECTED);
  const khaled=KHALED_QURAN_TERMS[1].filter(item=>EXPECTED.includes(item.surahNumber)).map(item=>item.surahNumber);
  assert.deepEqual(mashaal.map(item=>item.surahNumber),khaled);
  assert.deepEqual(mashaal.map(item=>item.title),['سورة الفاتحة','سورة الناس','سورة الفلق','سورة الإخلاص','سورة المسد']);
});

test('each Mashaal Quran card opens one verified local recitation with bundled Mushaf artwork',()=>{
  for(const surahNumber of EXPECTED){
    const plan=createMashaalActivityPlan(`listen-repeat-surah-${surahNumber}`);
    assert.equal(plan?.contentReady,true,`Surah ${surahNumber} should be ready`);
    assert.equal(plan.activities.length,1);
    const activity=plan.activities[0];
    assert.equal(activity.stimulus.surahNumber,surahNumber);
    assert.match(activity.mediaPath,/^\.\/assets\/recitation\/.*\.mp3$/);
    assert.match(activity.mediaSha256,/^[a-f0-9]{64}$/);
    assert.equal(activity.mushafPage.offlineBundled,true);
    assert.match(activity.mushafPage.imagePath,/^\.\/assets\/recitation\/kfqc-hafs-page-\d+\.svg$/);
  }
});

test('Mashaal Quran domain renders five independent surah cards while keeping one underlying learning skill',()=>{
  const cards=getMashaalDomainSkills('quran-islamic-education');
  const quranCards=cards.filter(card=>card.id.startsWith('listen-repeat-surah-'));
  assert.equal(quranCards.length,5);
  assert.deepEqual(quranCards.map(card=>Number(card.id.split('-').at(-1))),EXPECTED);
  assert.ok(quranCards.every(card=>card.contentReady&&card.activityCount===1));
});
