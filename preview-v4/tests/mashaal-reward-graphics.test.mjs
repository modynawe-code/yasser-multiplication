import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_REWARD_CATALOG } from '../src/modules/mashaal/rewards/mashaal-reward-catalog.js';
import { hasMashaalRewardGraphic,mashaalRewardGraphicMarkup } from '../src/modules/mashaal/ui/mashaal-reward-graphics.js';

test('every Mashaal reward has a local vector graphic before UI release',()=>{
  for(const reward of MASHAAL_REWARD_CATALOG){
    assert.equal(hasMashaalRewardGraphic(reward.graphicKey),true,reward.id);
    const markup=mashaalRewardGraphicMarkup(reward.graphicKey);
    assert.match(markup,/^<span class="mashaal-treasure-graphic/);
    assert.match(markup,/<svg viewBox="0 0 120 120"/);
  }
});

test('locked Mashaal reward graphics keep the same asset identity',()=>{
  const reward=MASHAAL_REWARD_CATALOG[0];
  const unlocked=mashaalRewardGraphicMarkup(reward.graphicKey);
  const locked=mashaalRewardGraphicMarkup(reward.graphicKey,{locked:true});
  assert.match(unlocked,/data-mashaal-reward-art="attempt-flower"/);
  assert.match(locked,/data-mashaal-reward-art="attempt-flower"/);
  assert.match(locked,/ locked"/);
});
