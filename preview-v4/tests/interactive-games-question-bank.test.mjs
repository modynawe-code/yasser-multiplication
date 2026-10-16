import test from 'node:test';
import assert from 'node:assert/strict';
import {gameQuestionBankStorageKey,loadGameQuestionBank,mergeGameQuestionBanks,nextGameQuestion,normalizeGameQuestion,orderCurriculumQuestions,saveGameQuestionBank} from '../src/modules/interactive-games/question-bank.js';
import {PRIMARY_QUESTION_BANK,PRIMARY_QUESTION_BANK_VERSION} from '../src/modules/interactive-games/primary-question-bank.js';

function memoryStorage(initial=null){const items=new Map(initial?[[gameQuestionBankStorageKey(),initial]]:[]);return{getItem:key=>items.get(key)||null,setItem:(key,value)=>items.set(key,value)};}

test('normalizes Wafy manual question text and optional answer',()=>{
  assert.deepEqual({...normalizeGameQuestion({id:'q1',text:'  كم؟ ',answer:'  خمسة '})},{id:'q1',text:'كم؟',answer:'خمسة',source:'manual'});
  assert.equal(normalizeGameQuestion({text:'  '}),null);
});

test('selects the first unasked question in Wafy bank order and returns no question when exhausted',()=>{
  const bank=[{id:'a',text:'أ'},{id:'b',text:'ب'}];
  assert.equal(nextGameQuestion(bank,['a']).question.id,'b');
  const exhausted=nextGameQuestion(bank,['a','b']);
  assert.equal(exhausted.question,null);assert.equal(exhausted.cycleRestarted,false);assert.deepEqual(exhausted.askedIds,['a','b']);
});

test('keeps semesters fully separate, then groups by grade and subject while preserving each subject order',()=>{
  const input=[
    {id:'math-2',text:'رياضيات ٢',grade:1,semester:1,subject:'الرياضيات'},
    {id:'science-1',text:'علوم ١',grade:1,semester:1,subject:'العلوم'},
    {id:'math-1',text:'رياضيات ١',grade:1,semester:1,subject:'الرياضيات'},
    {id:'term2',text:'فصل ٢',grade:1,semester:2,subject:'الرياضيات'},
    {id:'grade2',text:'صف ٢',grade:2,semester:1,subject:'الرياضيات'},
  ];
  assert.deepEqual(orderCurriculumQuestions(input).map(question=>question.id),['math-2','math-1','science-1','grade2','term2']);
  assert.equal(nextGameQuestion(input).question.id,'math-2');
});

test('persists game bank locally and can remove questions without touching profiles',()=>{
  const storage=memoryStorage();saveGameQuestionBank([{id:'a',text:'أ'},{id:'bad',text:' '}],storage);
  assert.deepEqual(loadGameQuestionBank(storage).map(question=>question.id),['a']);
  saveGameQuestionBank([],storage);assert.deepEqual(loadGameQuestionBank(storage),[]);
});

test('retains curriculum provenance when normalizing imported questions',()=>{
  const question=normalizeGameQuestion({id:'mnhaji-1',text:'  كم؟ ',answer:' خمسة ',grade:1,semester:2,subject:'الرياضيات',sourceUrl:'https://example.test/q'});
  assert.deepEqual({...question},{id:'mnhaji-1',text:'كم؟',answer:'خمسة',source:'manual',grade:1,semester:2,subject:'الرياضيات',sourceUrl:'https://example.test/q'});
});

test('merges exact Arabic duplicates while retaining their source references',()=>{
  const merged=mergeGameQuestionBanks(
    [{id:'a',text:'  ٨ + ٤ = ؟ ',answer:'١٢',source:'موقع أول',grade:1,semester:1,subject:'رياضيات',sourceUrl:'https://one.test'}],
    [{id:'b',text:'8+4=?',answer:'12',source:'موقع ثان',grade:2,semester:1,subject:'رياضيات',sourceUrl:'https://two.test'}],
  );
  assert.equal(merged.length,1);
  assert.deepEqual(merged[0].sources,['موقع أول','موقع ثان']);
  assert.equal(merged[0].contexts.length,2);
});

test('imports a seed batch once, so removed seed questions stay removed until a new batch version',()=>{
  const storage=memoryStorage(),seed=[{id:'seed-a',text:'سؤال أ',source:'موقع'}];
  assert.equal(loadGameQuestionBank(storage,seed,'v1').length,1);
  saveGameQuestionBank([],storage);
  assert.equal(loadGameQuestionBank(storage,seed,'v1').length,0);
  assert.equal(loadGameQuestionBank(storage,[...seed,{id:'seed-b',text:'سؤال ب'}],'v2').length,2);
});

test('the first Mnhaji import batch is traceable, scoped to primary school terms one and two, and duplicate-free',()=>{
  assert.equal(PRIMARY_QUESTION_BANK_VERSION,'mnhaji-primary-g1-g2-v16');
  assert.equal(new Set(PRIMARY_QUESTION_BANK.map(question=>question.id)).size,PRIMARY_QUESTION_BANK.length);
  assert.ok(PRIMARY_QUESTION_BANK.every(question=>[1,2,3,4,5,6].includes(question.grade)&&[1,2].includes(question.semester)&&question.sourceUrl&&question.documentUrl));
  const contentKeys=PRIMARY_QUESTION_BANK.map(question=>`${question.text}|${question.answer||''}`.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\s+/g,' ').trim().toLowerCase());
  assert.equal(new Set(contentKeys).size,PRIMARY_QUESTION_BANK.length);
  assert.deepEqual(PRIMARY_QUESTION_BANK.reduce((counts,question)=>{const key=`${question.grade}:${question.semester}:${question.subject}`;counts[key]=(counts[key]||0)+1;return counts;},{}),{
    '1:1:الرياضيات':3,
    '1:1:لغتي':8,
    '1:1:الدراسات الإسلامية':33,
    '1:2:الرياضيات':23,
    '1:2:العلوم':11,
    '1:2:لغتي':11,
    '2:1:لغتي':13,
    '2:1:الرياضيات':17,
    '2:1:العلوم':6,
    '2:2:الرياضيات':17,
    '2:2:العلوم':9,
    '2:2:الدراسات الإسلامية':14,
    '2:2:لغتي':13,
  });
});
