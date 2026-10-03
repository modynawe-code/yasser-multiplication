import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_REWARD_CATALOG } from '../src/modules/mashaal/rewards/mashaal-reward-catalog.js';
import { MASHAAL_TREASURE_THEME,mashaalRewardScopeCopy,mashaalRewardStateLabel } from '../src/modules/mashaal/ui/mashaal-reward-theme.js';

test('Mashaal treasure theme covers every reward scope and all visual states',()=>{
  assert.equal(MASHAAL_TREASURE_THEME.id,'mashaal-treasure-garden-v1');
  assert.deepEqual(
    [mashaalRewardStateLabel(),mashaalRewardStateLabel({unlocked:true}),mashaalRewardStateLabel({unlocked:true,isNew:true})],
    ['ينتظرك','مفتوح','جديد']
  );
  for(const reward of MASHAAL_REWARD_CATALOG){
    const copy=mashaalRewardScopeCopy(reward.scope);
    assert.ok(copy&&copy!=='لإنجاز جميل',`missing intentional scope copy for ${reward.id}`);
  }
});
