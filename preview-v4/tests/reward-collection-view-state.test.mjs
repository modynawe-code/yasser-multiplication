import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardCollectionViewState } from '../src/shared/ui/reward-collection-view-state.js';

function memoryStorage(){
  const data=new Map();
  return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};
}

test('reward collection view state tracks unseen unlocks per learner without touching reward ledger',()=>{
  const storage=memoryStorage();
  const mashaal=createRewardCollectionViewState({learnerId:'mashaal',storage});
  const khaled=createRewardCollectionViewState({learnerId:'khaled',storage});
  const first={awardKey:'mashaal:r1:1',rewardId:'r1',at:'2026-09-10T10:00:00.000Z'};
  const second={awardKey:'mashaal:r2:1',rewardId:'r2',at:'2026-09-10T10:05:00.000Z'};

  assert.equal(mashaal.isNew(first),true);
  mashaal.markSeen(first);
  assert.equal(mashaal.isNew(first),false);
  assert.equal(mashaal.isNew(second),true);
  assert.equal(khaled.isNew(first),true,'learner UI state must stay isolated');

  mashaal.markSeen(second);
  assert.equal(mashaal.isNew(first),false);
  assert.equal(mashaal.isNew(second),false);
});

test('reward collection view state tolerates missing browser storage',()=>{
  const state=createRewardCollectionViewState({learnerId:'future-child',storage:null});
  const unlock={awardKey:'future:1',rewardId:'reward',at:'2026-09-10T11:00:00.000Z'};
  assert.equal(state.isNew(unlock),true);
  state.markSeen(unlock);
  assert.equal(state.isNew(unlock),false);
});
