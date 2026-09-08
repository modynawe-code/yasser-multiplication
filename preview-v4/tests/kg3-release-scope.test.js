import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_RELEASE_MANIFEST } from '../src/modules/mashaal/curriculum/release-manifest.js';

test('KG3 release scope marks source-backed structure and authored activities verified while keeping recitation media explicit',()=>{
  const verified=Object.entries(MASHAAL_KG3_RELEASE_MANIFEST).filter(([,entry])=>entry.status==='verified').map(([key])=>key);
  assert.deepEqual(verified,['foundation','detailedSkillMap','activityContent','nationalSocialContent']);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.readySkills,24);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.activityContent.blockedSkills,1);
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.status,'verified-with-media-blocker');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.blocker,'approved-human-recitation-audio');
});
