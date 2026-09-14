import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQuestionBank,
  createQuestionRecord,
  findExactQuestionDuplicates,
  getQuestionBankCoverage,
  queryQuestionBank,
  validateQuestionRecord
} from '../src/shared/question-bank/index.js';
import {YASSER_SCIENCE_QUESTION_BANK} from '../src/modules/yasser/science/science-question-bank.js';
import {YASSER_SCIENCE_QUESTIONS} from '../src/modules/yasser/science/science-data.js';
import {YASSER_SCIENCE_COLLECTED_QUESTIONS} from '../src/modules/yasser/science/science-collected-questions.js';

test('shared question record is subject-agnostic and validates answers',()=>{
  const science=createQuestionRecord({
    id:'science:q1',subjectId:'science',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',
    unitId:'u1',chapterId:'c1',topicId:'cells',conceptId:'cell',type:'choice',difficulty:1,
    prompt:'ما الوحدة الأساسية في المخلوق الحي؟',choices:['الخلية','العضو'],answer:'الخلية',
    sources:[{label:'اختبار تدريبي',authority:'training-model'}]
  });
  const math=createQuestionRecord({
    id:'math:q1',subjectId:'math',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',
    unitId:'u1',chapterId:'c1',topicId:'numbers',conceptId:'place-value',type:'choice',difficulty:1,
    prompt:'اختر القيمة المنزلية الصحيحة.',choices:['10','100'],answer:'10',
    sources:[{label:'ورقة عمل',authority:'worksheet'}]
  });
  const bank=createQuestionBank([science,math],{id:'family-bank',strict:true});
  assert.equal(bank.questions.length,2);
  assert.equal(queryQuestionBank(bank,{subjectId:'science'}).length,1);
  assert.equal(queryQuestionBank(bank,{sourceAuthority:'worksheet'})[0].subjectId,'math');

  const invalid=createQuestionRecord({...science,id:'bad',answer:'إجابة غير موجودة'});
  assert.equal(validateQuestionRecord(invalid).ok,false);
});

test('question bank detects normalized exact duplicates instead of counting reposts twice',()=>{
  const base={subjectId:'science',gradeId:'grade-6',termId:'term-1',unitId:'u1',chapterId:'c1',conceptId:'cell',type:'choice',difficulty:1,choices:['الخلية','النسيج'],answer:'الخلية'};
  const a=createQuestionRecord({...base,id:'a',prompt:'ما هي الوحدة الأساسية؟',sources:[{label:'المصدر أ',authority:'training-model'}]});
  const b=createQuestionRecord({...base,id:'b',prompt:'ما هي الوحدة الأساسية ؟',sources:[{label:'المصدر ب',authority:'teacher-model'}]});
  const duplicates=findExactQuestionDuplicates([a,b]);
  assert.equal(duplicates.length,1);
  assert.deepEqual([...duplicates[0].ids],['a','b']);
});

test('expanded science collection is verified, source-backed and duplicate-free',()=>{
  assert.equal(YASSER_SCIENCE_COLLECTED_QUESTIONS.length,45);
  assert.ok(YASSER_SCIENCE_COLLECTED_QUESTIONS.every(question=>question.verified));
  assert.ok(YASSER_SCIENCE_COLLECTED_QUESTIONS.every(question=>question.sources.some(source=>['textbook','user-upload'].includes(source.authority))));
  assert.equal(findExactQuestionDuplicates(YASSER_SCIENCE_COLLECTED_QUESTIONS).length,0);
});

test('existing science data and collected source-backed questions share one reusable bank',()=>{
  assert.equal(YASSER_SCIENCE_QUESTION_BANK.validation.ok,true,YASSER_SCIENCE_QUESTION_BANK.validation.errors.join('\n'));
  assert.equal(YASSER_SCIENCE_QUESTION_BANK.questions.length,YASSER_SCIENCE_QUESTIONS.length+YASSER_SCIENCE_COLLECTED_QUESTIONS.length);
  const coverage=getQuestionBankCoverage(YASSER_SCIENCE_QUESTION_BANK);
  assert.equal(coverage.bySubject.science,YASSER_SCIENCE_QUESTION_BANK.questions.length);
  assert.equal(coverage.byUnit['unit-1-diversity-of-life'],YASSER_SCIENCE_QUESTION_BANK.questions.length);
  assert.ok((coverage.byChapter['chapter-1-cells']||0)>YASSER_SCIENCE_COLLECTED_QUESTIONS.length);
  assert.ok((coverage.byChapter['chapter-2-cell-heredity']||0)>0);
  assert.equal(queryQuestionBank(YASSER_SCIENCE_QUESTION_BANK,{chapterId:'chapter-1-cells',tags:['collected']}).length,YASSER_SCIENCE_COLLECTED_QUESTIONS.length);
});
