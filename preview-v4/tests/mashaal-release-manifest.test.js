import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_RELEASE_MANIFEST } from '../src/modules/mashaal/curriculum/release-manifest.js';

test('verified KG3 foundation is separated from draft detailed content',()=>{
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.foundation.status,'verified');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.detailedSkillMap.status,'draft');
  assert.equal(MASHAAL_KG3_RELEASE_MANIFEST.quranIslamicContent.status,'draft');
});
