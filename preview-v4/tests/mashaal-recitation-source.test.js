import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalRecitationSource,getMashaalRecitationMediaStatus,MASHAAL_RECITATION_TARGET } from '../src/modules/mashaal/curriculum/recitation-source-registry.js';
import { MASHAAL_RECITATION_MEDIA,validateMashaalRecitationAsset } from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';
import { MASHAAL_RELEASE_GATE } from '../src/modules/mashaal/release-gate.js';

test('Mashaal recitation source is human, officially reusable in applications, and never synthetic',()=>{
  const source=getMashaalRecitationSource();
  assert.equal(source.authorityAr,'مجمع الملك فهد لطباعة المصحف الشريف');
  assert.equal(source.reciterAr,'إبراهيم الأخضر');
  assert.equal(source.riwayahAr,'حفص عن عاصم');
  assert.equal(source.humanVoice,true);
  assert.equal(source.sourceApproved,true);
  assert.equal(source.rightsStatus,'explicit-public-use-for-applications');
  assert.equal(source.syntheticRecitationAllowed,false);
  assert.deepEqual(source.childLearningMode,['listen','repeat','replay']);
});

test('Mashaal recitation is intentionally limited to one surah: Al-Ikhlas',()=>{
  const source=getMashaalRecitationSource();
  assert.deepEqual(MASHAAL_RECITATION_TARGET,{surahNumber:112,surahNameAr:'الإخلاص',scope:'single-surah'});
  assert.equal(source.targetSurah.surahNumber,112);
  assert.equal(source.targetSurah.surahNameAr,'الإخلاص');
});

test('approved source alone does not open recitation until verified local Al-Ikhlas audio is present',()=>{
  const status=getMashaalRecitationMediaStatus();
  assert.equal(status.sourceApproved,true);
  assert.equal(status.targetSurah.surahNumber,112);
  assert.equal(MASHAAL_RECITATION_MEDIA.length,0);
  assert.equal(status.localAssets.length,0);
  assert.equal(status.localMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.approvedRecitationSource,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.syntheticRecitationAllowed,false);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');
});

test('recitation manifest rejects missing integrity data, remote paths and non-human audio',()=>{
  const base={id:'recitation-112',sourceId:'kfgqpc-ibrahim-al-akhdar-hafs',localPath:'./assets/recitation/112.mp3',sha256:'a'.repeat(64),surahNumber:112,surahNameAr:'الإخلاص',humanVoice:true};
  assert.equal(validateMashaalRecitationAsset(base).valid,true);
  assert.equal(validateMashaalRecitationAsset({...base,sha256:''}).valid,false);
  assert.equal(validateMashaalRecitationAsset({...base,localPath:'https://example.com/112.mp3'}).valid,false);
  assert.equal(validateMashaalRecitationAsset({...base,humanVoice:false}).valid,false);
  assert.equal(validateMashaalRecitationAsset({...base,surahNumber:0}).valid,false);
});
