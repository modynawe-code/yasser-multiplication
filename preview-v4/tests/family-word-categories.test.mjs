import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeArabicAnswer,answerStartsWithLetter,validateAnswerSheet,chooseRoundLetter,scoreWordRound,cumulativeScore,FAMILY_WORD_CATEGORIES
} from '../src/modules/games/categories/categories-engine.js';

test('normalizes Arabic variants for fair letter matching',()=>{
  assert.equal(normalizeArabicAnswer(' أَحمد '),'احمد');
  assert.equal(answerStartsWithLetter('إبراهيم','ا'),true);
  assert.equal(answerStartsWithLetter('محمد','م'),true);
  assert.equal(answerStartsWithLetter('خالد','م'),false);
});

test('ignores the Arabic definite article when matching and comparing answers',()=>{
  assert.equal(answerStartsWithLetter('السعودية','س'),true);
  assert.equal(answerStartsWithLetter('الأردن','ا'),true);
  const players=[{id:'a'},{id:'b'}];
  const a={person:'سالم',animal:'سمكة',plant:'سدر',object:'ساعة',country:'السعودية'};
  const b={person:'سامي',animal:'سمكة',plant:'سمسم',object:'سيف',country:'سعودية'};
  const round=scoreWordRound({players,answersByPlayer:{a,b},finishMsByPlayer:{a:1000,b:2000},letter:'س'});
  assert.equal(round.scores.a.categories.country.score,5);
  assert.equal(round.scores.b.categories.country.score,5);
});

test('sheet cannot be submitted until every answer exists and starts with round letter',()=>{
  const answers={person:'محمد',animal:'ماعز',plant:'موز',object:'مفتاح',country:'مصر'};
  assert.equal(validateAnswerSheet({answers,letter:'م'}).ok,true);
  const missing={...answers,country:''};
  assert.equal(validateAnswerSheet({answers:missing,letter:'م'}).ok,false);
  const wrong={...answers,animal:'حصان'};
  assert.equal(validateAnswerSheet({answers:wrong,letter:'م'}).ok,false);
});

test('letter picker avoids letters already used while options remain',()=>{
  assert.equal(chooseRoundLetter({usedLetters:['ا'],letters:['ا','ب'],random:()=>0}),'ب');
});

test('scores unique answers 10, repeated answers 5, and speed only for fully valid players',()=>{
  const players=[{id:'a'},{id:'b'},{id:'c'}];
  const answersByPlayer={
    a:{person:'محمد',animal:'ماعز',plant:'موز',object:'مفتاح',country:'مصر'},
    b:{person:'مازن',animal:'ماعز',plant:'ملوخية',object:'مسمار',country:'مصر'},
    c:{person:'مريم',animal:'مهر',plant:'موز',object:'مرآة',country:'مصر'}
  };
  const verdictsByPlayer={c:{animal:false}};
  const round=scoreWordRound({players,answersByPlayer,verdictsByPlayer,finishMsByPlayer:{a:40000,b:45000,c:30000},letter:'م'});
  assert.equal(round.scores.a.baseScore,35);
  assert.equal(round.scores.b.baseScore,40);
  assert.equal(round.scores.c.baseScore,30);
  assert.equal(round.scores.a.speedBonus,5);
  assert.equal(round.scores.b.speedBonus,3);
  assert.equal(round.scores.c.speedBonus,0);
  assert.equal(round.ranking[0],'b');
});

test('cumulative score adds rounds and counts round winners',()=>{
  const players=[{id:'a'},{id:'b'}];
  const categories=FAMILY_WORD_CATEGORIES;
  const answers={a:{person:'محمد',animal:'ماعز',plant:'موز',object:'مفتاح',country:'مصر'},b:{person:'مازن',animal:'مهر',plant:'ملوخية',object:'مسمار',country:'موريتانيا'}};
  const r1=scoreWordRound({players,answersByPlayer:answers,finishMsByPlayer:{a:1000,b:2000},letter:'م',categories});
  const r2=scoreWordRound({players,answersByPlayer:answers,finishMsByPlayer:{a:3000,b:1000},letter:'م',categories});
  const total=cumulativeScore([r1,r2],players);
  assert.equal(total.wins.a,1);
  assert.equal(total.wins.b,1);
  assert.equal(total.totals.a,total.totals.b);
});
