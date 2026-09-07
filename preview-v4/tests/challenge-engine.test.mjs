import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveChallengeProgress,newlyMasteredSkillsThisWeek } from '../src/shared/challenges/challenge-engine.js';
import { createRewardRepository } from '../src/shared/rewards/reward-repository.js';
import { createLearningRewardService } from '../src/shared/rewards/learning-reward-service.js';

function attempt(id,{date='2026-09-08T10:00:00Z',learnerId='yasser',skillId='table-2',cycle=id,isCorrect=true,attemptNumber=1}={}){return{attemptId:id,learnerId,skillId,questionId:id,learningCycleId:cycle,attemptNumber,isCorrect,createdAt:date};}
function memoryStorage(){const data=new Map();return{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};}
function masteredSkill(prefix,skillId,date){return Array.from({length:5},(_,index)=>attempt(`${prefix}-${index}`,{date:`${date}T10:${String(index).padStart(2,'0')}:00Z`,skillId}));}
function correctedCycles(prefix,date,skillId='review'){return Array.from({length:5},(_,index)=>[
  attempt(`${prefix}-${index}-w`,{date:`${date}T11:${String(index*2).padStart(2,'0')}:00Z`,skillId,cycle:`${prefix}-${index}`,isCorrect:false,attemptNumber:1}),
  attempt(`${prefix}-${index}-c`,{date:`${date}T11:${String(index*2+1).padStart(2,'0')}:00Z`,skillId,cycle:`${prefix}-${index}`,isCorrect:true,attemptNumber:2})
]).flat();}

test('daily challenge counts completed learning questions from today only',()=>{
  const log=[...Array.from({length:20},(_,index)=>attempt(`today-${index}`,{date:`2026-09-08T10:${String(index).padStart(2,'0')}:00Z`})),attempt('old',{date:'2026-09-07T10:00:00Z'})];
  const progress=deriveChallengeProgress(log,{learnerId:'yasser',now:new Date('2026-09-08T15:00:00Z')});
  assert.equal(progress.daily[0].current,20);
  assert.equal(progress.daily[0].target,20);
  assert.equal(progress.dailyComplete,true);
});

test('weekly challenge requires five corrected errors, two newly mastered skills and three active days',()=>{
  const log=[
    ...masteredSkill('a','table-2','2026-09-06'),
    ...masteredSkill('b','table-3','2026-09-07'),
    ...correctedCycles('fix','2026-09-08')
  ];
  const progress=deriveChallengeProgress(log,{learnerId:'yasser',now:new Date('2026-09-09T12:00:00Z')});
  assert.deepEqual(progress.weekly.map(item=>item.current),[5,2,3]);
  assert.equal(progress.weeklyComplete,true);
  assert.deepEqual(new Set(progress.newlyMasteredSkills),new Set(['table-2','table-3']));
});

test('a skill mastered before this week is not counted as new weekly mastery',()=>{
  const old=masteredSkill('old','table-2','2026-09-03'),current=masteredSkill('new','table-3','2026-09-07');
  const newly=newlyMasteredSkillsThisWeek([...old,...current],{learnerId:'yasser',now:new Date('2026-09-09T12:00:00Z')});
  assert.deepEqual(newly,['table-3']);
});

test('weekly challenge completion automatically unlocks one idempotent weekly cup',()=>{
  const repository=createRewardRepository({storage:memoryStorage()}),service=createLearningRewardService({repository});
  const state={attemptLog:[...masteredSkill('a','table-2','2026-09-06'),...masteredSkill('b','table-3','2026-09-07'),...correctedCycles('fix','2026-09-08')]};
  const first=service.evaluate('yasser',state,{now:new Date('2026-09-09T12:00:00Z')});
  assert.equal(first.challenges.weeklyComplete,true);
  assert.equal(first.summary.counts['weekly-cup'],1);
  const second=service.evaluate('yasser',state,{now:new Date('2026-09-09T13:00:00Z')});
  assert.equal(second.summary.counts['weekly-cup'],1);
});
