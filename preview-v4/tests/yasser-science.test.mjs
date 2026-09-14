import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_QUESTIONS} from '../src/modules/yasser/science/science-data.js';
import {applyScienceAttempt,createScienceSession,getScienceDashboard,getScienceReviewQuestionIds,submitScienceAnswer,validateScienceBank} from '../src/modules/yasser/science/science-engine.js';

test('science bank is valid and traceable to source material',()=>{
  const result=validateScienceBank();
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.ok(YASSER_SCIENCE_QUESTIONS.length>=30);
  assert.ok(YASSER_SCIENCE_QUESTIONS.every(item=>item.source?.label&&item.source?.page));
});

test('image challenge only contains questions with registered assets',()=>{
  const session=createScienceSession({mode:'images',count:20,rng:()=>.5});
  assert.ok(session.questions.length>=5);
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
