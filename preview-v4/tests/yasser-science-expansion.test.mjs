import test from 'node:test';
import assert from 'node:assert/strict';
import {YASSER_SCIENCE_ASSETS,YASSER_SCIENCE_QUESTIONS} from '../src/modules/yasser/science/science-data.js';
import {createScienceSession,validateScienceBank} from '../src/modules/yasser/science/science-engine.js';

const fixedRng=()=>0.37;

test('science bank remains valid after period-one expansion',()=>{
  const validation=validateScienceBank();
  assert.equal(validation.ok,true,validation.errors.join('\n'));
  assert.ok(YASSER_SCIENCE_QUESTIONS.length>=52);
  assert.ok(Object.keys(YASSER_SCIENCE_ASSETS).length>=6);
  assert.ok(YASSER_SCIENCE_QUESTIONS.filter(q=>q.assetId).length>=17);
});

test('image challenge rotates across distinct visuals before repeating them',()=>{
  const session=createScienceSession({mode:'images',count:6,rng:fixedRng});
  assert.equal(session.questions.length,6);
  assert.equal(new Set(session.questions.map(q=>q.assetId)).size,6);
});

test('school exam keeps image questions present but not dominant',()=>{
  const session=createScienceSession({mode:'exam',count:20,rng:fixedRng});
  const imageCount=session.questions.filter(q=>q.assetId).length;
  assert.equal(session.questions.length,20);
  assert.ok(imageCount>=4,`expected at least 4 image questions, got ${imageCount}`);
  assert.ok(imageCount<=6,`expected image questions to stay a minority, got ${imageCount}`);
  assert.ok(new Set(session.questions.map(q=>q.unit)).size>=5,'exam should span all period-one units');
});
