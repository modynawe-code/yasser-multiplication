import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_QUESTION_BANK,GENERAL_QUESTION_BANK_STATS} from '../src/modules/interactive-games/general-question-bank.js';
import {isPlayableGameQuestion,mergeGameQuestionBanks,nextGameQuestion} from '../src/modules/interactive-games/question-bank.js';

test('general family bank has expected batches and review gates',()=>{
  assert.equal(GENERAL_QUESTION_BANK.length,342);
  assert.deepEqual(GENERAL_QUESTION_BANK_STATS,{
    total:342,
    playable:187,
    pendingReview:142,
    needsRevision:3,
    duplicates:10
  });
  assert.equal(GENERAL_QUESTION_BANK.filter(question=>question.batch==='user-batch-1').length,100);
  assert.equal(GENERAL_QUESTION_BANK.filter(question=>question.batch==='user-batch-2').length,142);
  assert.equal(GENERAL_QUESTION_BANK.filter(question=>question.batch==='assistant-batch-3').length,100);
});

test('pending, revision, and duplicate questions are not selected for play',()=>{
  const bank=[
    {id:'pending',text:'أ',answer:'١',reviewStatus:'pending_review',enabledForPlay:false},
    {id:'revision',text:'ب',answer:'٢',reviewStatus:'needs_revision',enabledForPlay:false},
    {id:'duplicate',text:'ج',answer:'٣',reviewStatus:'duplicate',enabledForPlay:false},
    {id:'live',text:'د',answer:'٤',reviewStatus:'initial_review',enabledForPlay:true}
  ];
  assert.equal(isPlayableGameQuestion(bank[0]),false);
  assert.equal(isPlayableGameQuestion(bank[1]),false);
  assert.equal(isPlayableGameQuestion(bank[2]),false);
  assert.equal(isPlayableGameQuestion(bank[3]),true);
  assert.equal(nextGameQuestion(bank,[]).question.id,'live');
});

test('same stable id refreshes seed metadata without duplicating question',()=>{
  const merged=mergeGameQuestionBanks(
    [{id:'same',text:'سؤال',answer:'جواب',reviewStatus:'pending_review',enabledForPlay:false,source:'old'}],
    [{id:'same',text:'سؤال',answer:'جواب',reviewStatus:'initial_review',enabledForPlay:true,source:'seed'}]
  );
  assert.equal(merged.length,1);
  assert.equal(merged[0].reviewStatus,'initial_review');
  assert.equal(merged[0].enabledForPlay,true);
});
