import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createLearningRewardService,createRewardingRepository } from '../src/shared/rewards/learning-reward-service.js';

function memoryStorage(){const data=new Map();return{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};}
function event(index,{learnerId='yasser',skillId='table-2',isCorrect=true}={}){return{attemptId:`a-${learnerId}-${index}`,learnerId,skillId,questionId:`q-${index}`,learningCycleId:`cycle-${learnerId}-${index}`,attemptNumber:1,isCorrect,createdAt:`2026-09-07T10:${String(index).padStart(2,'0')}:00Z`};}

test('learning reward service awards from persisted academic evidence and stays idempotent',()=>{
  const rewardRepository=createRewardRepository({storage:memoryStorage()}),service=createLearningRewardService({repository:rewardRepository});
  const state={attemptLog:Array.from({length:10},(_,index)=>event(index))};
  const first=service.evaluate('yasser',state,{now:new Date('2026-09-07T12:00:00Z')});
  assert.equal(first.added,2);
  assert.equal(first.summary.counts['accuracy-medal'],1);
  assert.equal(first.summary.counts['mastery-shield'],1);
  const second=service.evaluate('yasser',state,{now:new Date('2026-09-07T12:05:00Z')});
  assert.equal(second.added,0);
  assert.equal(second.summary.total,2);
});

test('reward evaluation never mixes learner evidence',()=>{
  const service=createLearningRewardService({repository:createRewardRepository({storage:memoryStorage()})});
  const mixed={attemptLog:[...Array.from({length:10},(_,index)=>event(index)),...Array.from({length:10},(_,index)=>event(index,{learnerId:'khaled',skillId:'money'}))]};
  service.evaluate('yasser',mixed,{now:new Date('2026-09-07T12:00:00Z')});
  assert.equal(service.getSummary('yasser').total,2);
  assert.equal(service.getSummary('khaled').total,0);
  service.evaluate('khaled',mixed,{now:new Date('2026-09-07T12:00:00Z')});
  assert.equal(service.getSummary('khaled').total,2);
});

test('rewarding repository evaluates only after a successful learning save',()=>{
  let saves=0,evaluations=0;
  const base={load:()=>({attemptLog:[]}),save:()=>{saves++;return true;},export:()=>''};
  const wrapped=createRewardingRepository({learnerId:'yasser',repository:base,rewardService:{evaluate:(learnerId,state)=>{evaluations++;assert.equal(learnerId,'yasser');assert.ok(state);}}});
  assert.equal(wrapped.save({attemptLog:[]}),true);
  assert.equal(saves,1);assert.equal(evaluations,1);
});

test('composition root routes learner persistence through reward service and PWA caches it',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(main,/createLearningRewardService/);
  assert.match(main,/createRewardingRepository/);
  assert.match(main,/rewardService\.evaluate\('yasser',yasser\.getState\(\)\)/);
  assert.match(main,/rewardService\.evaluate\('khaled',khaled\.getState\(\)\)/);
  assert.match(worker,/src\/shared\/rewards\/learning-reward-service\.js/);
});
