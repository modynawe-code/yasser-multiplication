import test from 'node:test';
import assert from 'node:assert/strict';
import { rewardPresentationCatalog,rewardPresentationUnlocked,rewardIllustrationSource } from '../src/shared/ui/game-inspired-rewards.js';
import { DIRECT_REWARD_ASSET_KEYS,directRewardAssetSource,getRewardImageUrl } from '../src/shared/ui/reward-assets.js';
import { UPLOADED_REWARD_ASSET_KEYS } from '../src/shared/ui/uploaded-rewards.js';

test('all 18 uploaded rewards are available to both Yasser and Khaled',()=>{
  assert.equal(UPLOADED_REWARD_ASSET_KEYS.length,18);
  for(const learnerId of ['yasser','khaled']){
    const catalog=rewardPresentationCatalog(learnerId);
    assert.equal(catalog.length,27);
    assert.equal(catalog.filter(item=>item.category==='personal').length,6);
    assert.equal(catalog.filter(item=>item.category==='collection').length,18);
    assert.equal(catalog.filter(item=>item.category==='shared').length,3);
    assert.deepEqual(catalog.filter(item=>item.category==='collection').map(item=>item.graphicKey),[...UPLOADED_REWARD_ASSET_KEYS]);
  }
});

test('uploaded reward art resolves directly to local WebP files and retains SVG fallbacks',async()=>{
  assert.equal(DIRECT_REWARD_ASSET_KEYS.length,33);
  for(const key of UPLOADED_REWARD_ASSET_KEYS){
    const direct=directRewardAssetSource(key);
    assert.equal(direct,`assets/rewards/${key}.webp`);
    assert.equal(await getRewardImageUrl(key),direct);
    assert.match(rewardIllustrationSource(key),/^data:image\/svg\+xml/);
  }
});

test('uploaded collection unlocks progressively from the existing reward ledger',()=>{
  const summary={
    counts:{'progress-badge':3},
    unlocks:[
      {rewardId:'progress-badge',at:'2026-09-01T00:00:00Z'},
      {rewardId:'progress-badge',at:'2026-09-02T00:00:00Z'},
      {rewardId:'progress-badge',at:'2026-09-03T00:00:00Z'}
    ]
  };
  const collection=rewardPresentationCatalog('yasser').filter(item=>item.category==='collection');
  const byId=Object.fromEntries(collection.map(item=>[item.id,item]));
  assert.equal(rewardPresentationUnlocked(byId['shared-emerald-cube'],summary),true);
  assert.equal(rewardPresentationUnlocked(byId['shared-golden-apple'],summary),true);
  assert.equal(rewardPresentationUnlocked(byId['shared-prism-cube'],summary),false);
});
