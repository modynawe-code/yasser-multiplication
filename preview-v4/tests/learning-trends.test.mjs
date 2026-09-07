import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateLearningStreak,summarizeLearningTrends } from '../src/shared/progress/learning-trends.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createLearningRewardService } from '../src/shared/rewards/learning-reward-service.js';

function event(id,date,isCorrect=true,{learnerId='yasser',skillId='table-2'}={}){return{attemptId:id,learnerId,skillId,questionId:id,learningCycleId:id,attemptNumber:1,isCorrect,createdAt:date};}
function memoryStorage(){const data=new Map();return{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};}

test('learning streak counts consecutive active calendar days and tolerates yesterday as the latest day',()=>{
  const log=[event('d1','2026-09-05T10:00:00Z'),event('d2','2026-09-06T10:00:00Z'),event('d3','2026-09-07T10:00:00Z')];
  assert.equal(calculateLearningStreak(log,{learnerId:'yasser',now:new Date('2026-09-07T12:00:00Z')}),3);
  assert.equal(calculateLearningStreak(log.slice(0,2),{learnerId:'yasser',now:new Date('2026-09-07T12:00:00Z')}),2);
  assert.equal(calculateLearningStreak([event('old','2026-09-04T10:00:00Z')],{learnerId:'yasser',now:new Date('2026-09-07T12:00:00Z')}),0);
});

test('weekly improvement compares mastery with the immediately previous week only',()=>{
  const log=[
    event('p1','2026-09-03T10:00:00Z',true),event('p2','2026-09-04T10:00:00Z',false),
    event('c1','2026-09-06T10:00:00Z',true),event('c2','2026-09-07T10:00:00Z',true)
  ];
  const trends=summarizeLearningTrends(log,{learnerId:'yasser',now:new Date('2026-09-07T12:00:00Z')});
  assert.equal(trends.previousWeek.masteryScore,50);
  assert.equal(trends.currentWeek.masteryScore,100);
  assert.equal(trends.improvementPct,50);
  assert.equal(trends.activeDaysThisWeek,2);
});

test('reward service derives streak flame and improvement badge from immutable attempt history',()=>{
  const repository=createRewardRepository({storage:memoryStorage()}),service=createLearningRewardService({repository});
  const state={attemptLog:[
    event('p1','2026-09-03T10:00:00Z',true),event('p2','2026-09-04T10:00:00Z',false),
    event('d1','2026-09-05T10:00:00Z',true),event('d2','2026-09-06T10:00:00Z',true),event('d3','2026-09-07T10:00:00Z',true)
  ]};
  const result=service.evaluate('yasser',state,{now:new Date('2026-09-07T12:00:00Z')});
  assert.equal(result.trends.streakDays,5);
  assert.ok(result.trends.improvementPct>=10);
  assert.equal(result.summary.counts['streak-flame'],1);
  assert.equal(result.summary.counts['progress-badge'],1);
});

test('learning trends are part of the offline application shell',async()=>{
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(worker,/src\/shared\/progress\/learning-trends\.js/);
  assert.match(worker,/shell-56/);
});
