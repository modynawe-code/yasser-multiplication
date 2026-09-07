import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildRewardCabinetMarkup } from '../src/shared/ui/reward-cabinet.js';
import { REWARD_ASSET_KEYS,rewardAssetSource,getRewardImageUrl } from '../src/shared/ui/reward-assets.js';

const status={
  summary:{total:2,counts:{'mastery-cup':1,'streak-flame':1},unlocks:[{rewardId:'mastery-cup',at:'2026-09-07T10:00:00Z'},{rewardId:'streak-flame',at:'2026-09-07T11:00:00Z'}]},
  trends:{streakDays:3},
  challenges:{daily:[{id:'daily-questions',label:'أجب 20 سؤالًا',current:8,target:20,pct:40,complete:false}],weekly:[{id:'weekly-corrections',label:'صحح 5 أخطاء',current:2,target:5,pct:40,complete:false}]}
};

test('reward cabinet renders the full eight-item catalog with shared graphic keys',()=>{
  const markup=buildRewardCabinetMarkup({status});
  assert.equal((markup.match(/data-reward-id=/g)||[]).length,8);
  assert.match(markup,/data-reward-graphic="mastery-cup"/);
  assert.match(markup,/data-reward-id="mastery-cup" data-unlocked="true"/);
  assert.match(markup,/data-reward-id="weekly-cup" data-unlocked="false"/);
  assert.doesNotMatch(markup,/assets\/rewards\/yasser|assets\/rewards\/khaled/);
  assert.doesNotMatch(markup,/🏆|🎯|🔥|⭐/u);
});

test('reward graphics are shared while learner ownership stays outside the asset namespace',()=>{
  assert.equal(REWARD_ASSET_KEYS.length,8);
  assert.equal(rewardAssetSource('mastery-cup'),'assets/rewards/mastery-cup.b64.txt');
  assert.equal(rewardAssetSource('unknown'),null);
});

test('all approved reward sources decode to real PNG bytes',async()=>{
  for(const key of REWARD_ASSET_KEYS){
    const encoded=(await readFile(new URL(`../assets/rewards/${key}.b64.txt`,import.meta.url),'utf8')).trim();
    const bytes=Buffer.from(encoded,'base64');
    assert.ok(bytes.length>3000,`${key} should contain a material image asset`);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${key} should decode as PNG`);
  }
});

test('reward image loader validates and returns a PNG data URL',async()=>{
  const encoded=(await readFile(new URL('../assets/rewards/mastery-cup.b64.txt',import.meta.url),'utf8')).trim();
  const url=await getRewardImageUrl('mastery-cup',{fetchImpl:async()=>({ok:true,text:async()=>encoded})});
  assert.match(url,/^data:image\/png;base64,iVBORw0KGgo/);
});

test('composition root owns cabinet navigation while learner controllers stay untouched',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const yasser=await readFile(new URL('../src/ui/app-controller.js',import.meta.url),'utf8');
  const khaled=await readFile(new URL('../src/modules/khaled/ui/khaled-controller.js',import.meta.url),'utf8');
  assert.match(main,/createRewardCabinetController/);
  assert.match(main,/cabinet\.start\(\)/);
  assert.match(main,/cabinet\?\.leave\(\)/);
  assert.doesNotMatch(yasser,/rewardCabinet|reward-cabinet/);
  assert.doesNotMatch(khaled,/rewardCabinet|reward-cabinet/);
});

test('reward cabinet, loader and all eight graphic sources are part of the offline shell',async()=>{
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(worker,/src\/shared\/ui\/reward-assets\.js/);
  assert.match(worker,/src\/shared\/ui\/reward-cabinet\.js/);
  assert.match(worker,/src\/shared\/ui\/reward-cabinet\.css/);
  for(const key of REWARD_ASSET_KEYS)assert.match(worker,new RegExp(`assets/rewards/${key}\\.b64\\.txt`));
  assert.match(worker,/shell-\d+/);
});
