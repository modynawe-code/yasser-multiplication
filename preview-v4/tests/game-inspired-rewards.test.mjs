import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_REWARD_PRESENTATIONS,rewardPresentationCatalog,rewardPresentationUnlocked,latestRewardPresentation,rewardIllustrationSource } from '../src/shared/ui/game-inspired-rewards.js';
import { getRewardImageUrl,REWARD_ASSET_KEYS,rewardAssetSource } from '../src/shared/ui/reward-assets.js';
import { buildRewardCabinetMarkup } from '../src/shared/ui/reward-cabinet.js';

test('Yasser and Khaled each receive six personal rewards plus three shared chests',()=>{
  for(const learnerId of ['yasser','khaled']){
    const catalog=rewardPresentationCatalog(learnerId);
    assert.equal(catalog.length,9);
    assert.equal(catalog.filter(item=>item.category==='personal').length,6);
    assert.equal(catalog.filter(item=>item.category==='shared').length,3);
  }
});

test('shared chests unlock progressively from the existing surprise-box milestones',()=>{
  const summary={counts:{'surprise-box':2},unlocks:[{rewardId:'surprise-box',at:'2026-09-01T00:00:00Z'},{rewardId:'surprise-box',at:'2026-09-02T00:00:00Z'}]};
  const chests=rewardPresentationCatalog('khaled').filter(item=>item.category==='shared');
  assert.equal(rewardPresentationUnlocked(chests[0],summary),true);
  assert.equal(rewardPresentationUnlocked(chests[1],summary),true);
  assert.equal(rewardPresentationUnlocked(chests[2],summary),false);
});

test('all themed reward illustrations are original inline SVG assets and do not expand legacy PNG keys',async()=>{
  assert.equal(REWARD_ASSET_KEYS.length,8);
  assert.equal(rewardAssetSource('khaled-rocket-car'),null);
  for(const catalog of Object.values(GAME_REWARD_PRESENTATIONS)){
    for(const item of catalog){
      const source=rewardIllustrationSource(item.graphicKey);
      assert.match(source,/^data:image\/svg\+xml/);
      assert.equal(await getRewardImageUrl(item.graphicKey),source);
    }
  }
});

test('presentation copy does not ship third-party game or platform branding',()=>{
  const text=JSON.stringify(GAME_REWARD_PRESENTATIONS);
  assert.doesNotMatch(text,/minecraft|rocket\s*league|fortnite|roblox|playstation|xbox|epic\s*games/i);
});

test('Khaled cabinet renders themed rewards and uses a three-step chest progression',()=>{
  const status={summary:{total:3,counts:{'mastery-cup':1,'progress-badge':1,'surprise-box':1},unlocks:[{rewardId:'mastery-cup',at:'2026-09-01T00:00:00Z'},{rewardId:'progress-badge',at:'2026-09-02T00:00:00Z'},{rewardId:'surprise-box',at:'2026-09-03T00:00:00Z'}]},trends:{streakDays:1},challenges:{daily:[],weekly:[]}};
  const markup=buildRewardCabinetMarkup({status,learnerId:'khaled'});
  assert.equal((markup.match(/data-reward-id=/g)||[]).length,9);
  assert.match(markup,/data-reward-id="khaled-rocket-car" data-unlocked="true"/);
  assert.match(markup,/data-reward-id="shared-common-chest" data-unlocked="true"/);
  assert.match(markup,/data-reward-id="shared-silver-chest" data-unlocked="false"/);
});

test('latest themed reward follows the persisted academic reward ledger without migrating data',()=>{
  const summary={counts:{'accuracy-medal':1,'progress-badge':1},unlocks:[{rewardId:'accuracy-medal',at:'2026-09-01T00:00:00Z'},{rewardId:'progress-badge',at:'2026-09-04T00:00:00Z'}]};
  assert.equal(latestRewardPresentation('yasser',summary).id,'yasser-challenger-badge');
  assert.equal(latestRewardPresentation('khaled',summary).id,'khaled-power-cube');
});
