import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerPassParcelQuestion,
  createPassParcelGame,
  currentPassParcelHolder,
  passParcelToNext,
  startPassParcelRound,
  stopPassParcelRound
} from '../src/modules/interactive-games/pass-the-parcel-engine.js';

test('pass the parcel starts with a hidden random 12–25 second window',()=>{
  const values=[0.4,0.5];
  const random=()=>values.shift();
  const game=startPassParcelRound(createPassParcelGame(['أ','ب','ج']),{random});
  assert.equal(game.status,'passing');
  assert.equal(currentPassParcelHolder(game),'ب');
  assert.ok(game.durationMs>=12000&&game.durationMs<=25000);
});

test('passing advances the holder and wraps around',()=>{
  const game={...createPassParcelGame(['أ','ب']),status:'passing',holderIndex:1};
  assert.equal(currentPassParcelHolder(passParcelToNext(game)),'أ');
});

test('correct answer gives one point and target score wins',()=>{
  let game=createPassParcelGame(['أ','ب'],{targetScore:1});
  game=startPassParcelRound(game,{random:()=>0,minMs:12000,maxMs:12000});
  game=stopPassParcelRound(game,'q1');
  game=answerPassParcelQuestion(game,'correct');
  assert.equal(game.scores['أ'],1);
  assert.equal(game.status,'finished');
  assert.equal(game.winner,'أ');
});

test('wrong answer gives no point and continues to next round',()=>{
  let game=createPassParcelGame(['أ','ب']);
  game=startPassParcelRound(game,{random:()=>0,minMs:12000,maxMs:12000});
  game=stopPassParcelRound(game,'q1');
  game=answerPassParcelQuestion(game,'wrong');
  assert.equal(game.scores['أ'],0);
  assert.equal(game.status,'round_complete');
});
