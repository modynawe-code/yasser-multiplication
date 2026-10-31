import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {KHALED_QURAN_TERMS} from '../src/modules/khaled/quran/khaled-quran.js';
import {YASSER_QURAN_TERMS} from '../src/modules/yasser/quran/yasser-quran.js';
import {MASHAAL_RECITATION_MEDIA} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';
import {pageSources} from '../src/modules/mashaal/quran/quran-surah-player.js';
import {collectRequiredQuranPages,validateVerifiedHafsSvg,QURAN_SVG_PIN} from '../tools/build-quran-svg-pages.mjs';

test('all three unchanged curricula have complete local-page contracts',()=>{
  const required=collectRequiredQuranPages();
  assert.equal(required.length,59);
  assert.equal(required[0],1);
  assert.ok(required.includes(602)&&required.includes(415)&&required.includes(564));
  assert.equal(required.at(-1),604);
  const chapters=[
    ...Object.values(KHALED_QURAN_TERMS).flat(),
    ...Object.values(YASSER_QURAN_TERMS).flatMap(t=>[...t.recitation,...t.memorization]),
    ...MASHAAL_RECITATION_MEDIA
  ];
  assert.equal(new Set(chapters.map(x=>x.surahNumber)).size,32);
  for(const chapter of chapters){
    for(const page of (chapter.mushafPages||[chapter.mushafPage])){
      assert.equal(page.offlineBundled,true);
      assert.equal(page.distributionCommit,QURAN_SVG_PIN);
      assert.equal(pageSources(page)[0],
        './assets/recitation/kfqc-hafs-page-'+page.pageNumber+'.svg');
    }
  }
});

test('verified original Hafs SVG is accepted, malformed or active content is rejected',async()=>{
  const original=await readFile(new URL('../assets/recitation/kfqc-hafs-page-604.svg',import.meta.url),'utf8');
  assert.equal(validateVerifiedHafsSvg(original,604),true);
  assert.throws(()=>validateVerifiedHafsSvg('<svg><script>alert(1)</script></svg>',604));
  assert.throws(()=>validateVerifiedHafsSvg('missing',602));
  assert.throws(()=>validateVerifiedHafsSvg(original.replace(/viewBox="[^"]+"/,'viewBox="broken"'),604));
});
