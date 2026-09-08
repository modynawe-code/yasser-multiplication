import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_RELEASE_MANIFEST } from '../src/modules/mashaal/curriculum/release-manifest.js';

test('KG3 release manifest records verified content and isolates the remaining recitation-media blocker',()=>{
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.foundation.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.sourceId,'saudi-early-learning-standards-3-6-2015');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.totalSkills,25);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.readySkills,24);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.blockedSkills,1);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.status,'verified-with-media-blocker');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.blocker,'approved-human-recitation-audio');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.nationalSocialContent.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.nationalSocialContent.readySkills,3);
});
