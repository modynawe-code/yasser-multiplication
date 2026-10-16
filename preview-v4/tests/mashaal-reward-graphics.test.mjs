import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_REWARD_CATALOG } from '../src/modules/mashaal/rewards/mashaal-reward-catalog.js';
import { hasMashaalRewardGraphic,mashaalRewardGraphicMarkup } from '../src/modules/mashaal/ui/mashaal-reward-graphics.js';

test('every Mashaal reward has a local graphic before UI release',()=>{
  for(const reward of MASHAAL_REWARD_CATALOG){
    assert.equal(hasMashaalRewardGraphic(reward.graphicKey,{assetPath:reward.assetPath}),true,reward.id);
    const markup=mashaalRewardGraphicMarkup(reward.graphicKey,{assetPath:reward.assetPath});
    assert.match(markup,/^<span class="mashaal-treasure-graphic/);
    if(reward.tier==='premium')assert.match(markup,/<img src="assets\/mashaal\/rewards\/premium\//);
    else assert.match(markup,/<svg viewBox="0 0 120 120"/);
  }
});

test('locked Mashaal reward graphics keep the same asset identity',()=>{
  const basic=MASHAAL_REWARD_CATALOG.find(item=>item.tier==='basic');
  const premium=MASHAAL_REWARD_CATALOG.find(item=>item.tier==='premium');
  const unlocked=mashaalRewardGraphicMarkup(basic.graphicKey);
  const locked=mashaalRewardGraphicMarkup(basic.graphicKey,{locked:true});
  assert.match(unlocked,/data-mashaal-reward-art="attempt-flower"/);
  assert.match(locked,/data-mashaal-reward-art="attempt-flower"/);
  assert.match(locked,/ locked"/);
  const premiumLocked=mashaalRewardGraphicMarkup(premium.graphicKey,{locked:true,assetPath:premium.assetPath});
  assert.match(premiumLocked,/ locked"/);
  assert.match(premiumLocked,/premium-shoes\.webp/);
});
