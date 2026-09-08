import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_RELEASE_MANIFEST } from '../src/modules/mashaal/curriculum/release-manifest.js';

test('verified KG3 structure and skill map stay separate from draft release content',()=>{
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.foundation.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.sourceId,'saudi-early-learning-standards-3-6-2015');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.status,'draft');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.status,'draft');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.nationalSocialContent.status,'draft');
});
