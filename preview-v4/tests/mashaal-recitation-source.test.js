import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalRecitationSource,getMashaalRecitationMediaStatus } from '../src/modules/mashaal/curriculum/recitation-source-registry.js';
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

test('approved source alone does not open recitation until a local offline asset is present',()=>{
  const status=getMashaalRecitationMediaStatus();
  assert.equal(status.sourceApproved,true);
  assert.equal(status.localMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.approvedRecitationSource,true);
  assert.equal(MASHAAL_RELEASE_GATE.requiredMediaReady,false);
  assert.equal(MASHAAL_RELEASE_GATE.syntheticRecitationAllowed,false);
  assert.equal(MASHAAL_RELEASE_GATE.blockerCode,'approved-human-recitation-audio');
});
