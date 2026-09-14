import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_QUESTIONS} from '../src/modules/yasser/science/science-data.js';
import {applyScienceAttempt,createScienceSession,getScienceDashboard,getScienceReviewQuestionIds,submitScienceAnswer,validateScienceBank} from '../src/modules/yasser/science/science-engine.js';

test('science bank is valid and traceable to source material',()=>{
  const result=validateScienceBank();
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.ok(YASSER_SCIENCE_QUESTIONS.length>=35);
  assert.ok(YASSER_SCIENCE_QUESTIONS.every(item=>item.source?.label&&item.source?.page));
});

test('image challenge contains eight source-backed visual questions',()=>{
  const session=createScienceSession({mode:'images',rng:()=>.5});
  assert.equal(session.questions.length,8);
  assert.ok(session.questions.every(item=>item.assetId&&YASSER_SCIENCE_ASSETS[item.assetId]));
});

test('wrong answer enters review queue and concept stats',()=>{
  const session=createScienceSession({mode:'quick',count:1,rng:()=>.1});
  const question=session.questions[0];
  const wrong=question.choices.find(choice=>choice!==question.answer);
  const result=submitScienceAnswer({session,answer:wrong,answeredAt:'2026-09-14T10:00:00.000Z'});
  assert.equal(result.accepted,true);assert.equal(result.attempt.isCorrect,false);
  const progress=applyScienceAttempt({},result.attempt);
  assert.deepEqual(getScienceReviewQuestionIds(progress),[question.id]);
  assert.equal(progress.concepts[question.concept].wrong,1);
});

test('latest corrected answer clears the question from review',()=>{
  const question=YASSER_SCIENCE_QUESTIONS.find(item=>item.id==='cell-energy-01');
  let progress={};
  progress=applyScienceAttempt(progress,{mode:'quick',questionId:question.id,concept:question.concept,unit:question.unit,answer:'خطأ',correctAnswer:question.answer,isCorrect:false,earned:0,answeredAt:'2026-09-14T10:00:00.000Z'});
  progress=applyScienceAttempt(progress,{mode:'review',questionId:question.id,concept:question.concept,unit:question.unit,answer:question.answer,correctAnswer:question.answer,isCorrect:true,earned:10,answeredAt:'2026-09-14T10:05:00.000Z'});
  assert.deepEqual(getScienceReviewQuestionIds(progress),[]);
});

test('review prefers a different question for the same missed concept when available',()=>{
  const missed=YASSER_SCIENCE_QUESTIONS.find(item=>item.id==='cell-image-wall-01');
  const session=createScienceSession({mode:'review',count:1,reviewQuestionIds:[missed.id],rng:()=>.5});
  assert.equal(session.questions.length,1);
  assert.equal(session.questions[0].concept,missed.concept);
  assert.notEqual(session.questions[0].id,missed.id);
});

test('school exam balances coverage across all science units',()=>{
  const session=createScienceSession({mode:'exam',count:20,rng:()=>.5});
  const counts=new Map();
  for(const question of session.questions)counts.set(question.unit,(counts.get(question.unit)||0)+1);
  assert.equal(counts.size,5);
  const values=[...counts.values()];
  assert.ok(Math.max(...values)-Math.min(...values)<=1);
});

test('review attempts do not inflate exam readiness',()=>{
  let progress={};
  for(let index=0;index<10;index++)progress=applyScienceAttempt(progress,{mode:'quick',questionId:`q${index}`,concept:`c${index}`,unit:'cells',answer:'x',correctAnswer:'y',isCorrect:false,earned:0,answeredAt:`2026-09-14T10:${String(index).padStart(2,'0')}:00.000Z`});
  for(let index=0;index<10;index++)progress=applyScienceAttempt(progress,{mode:'review',questionId:`r${index}`,concept:`r${index}`,unit:'cells',answer:'x',correctAnswer:'x',isCorrect:true,earned:10,answeredAt:`2026-09-14T11:${String(index).padStart(2,'0')}:00.000Z`});
  const dashboard=getScienceDashboard(progress);
  assert.equal(dashboard.recentAccuracy,0);
  assert.equal(dashboard.readiness,'تحتاج مراجعة');
});

test('dashboard readiness is based on attempts, not arbitrary points',()=>{
  let progress={};
  for(let index=0;index<10;index++){
    progress=applyScienceAttempt(progress,{questionId:`q${index}`,concept:`c${index}`,unit:'cells',answer:'x',correctAnswer:'x',isCorrect:true,earned:10,answeredAt:`2026-09-14T10:${String(index).padStart(2,'0')}:00.000Z`});
  }
  const dashboard=getScienceDashboard(progress);
  assert.equal(dashboard.recentAccuracy,100);assert.equal(dashboard.readiness,'جاهزية قوية');
});

test('science assets are bundled and Yasser gateway exposes science',()=>{
  for(const asset of Object.values(YASSER_SCIENCE_ASSETS)){
    const url=new URL(`../${asset.src}`,import.meta.url);
    assert.equal(existsSync(fileURLToPath(url)),true,asset.src);
  }
  const shell=readFileSync(new URL('../src/modules/yasser/ui/yasser-home-shell.js',import.meta.url),'utf8');
  assert.match(shell,/id="introScience"/);
  assert.match(shell,/yasser-science\.css/);
});
