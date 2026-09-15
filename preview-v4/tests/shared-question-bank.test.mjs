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
import {YASSER_SCIENCE_COLLECTED_ALL,YASSER_SCIENCE_QUESTION_BANK,YASSER_SCIENCE_PLAYABLE_QUESTIONS} from '../src/modules/yasser/science/science-question-bank.js';
import {YASSER_SCIENCE_QUESTIONS,YASSER_SCIENCE_ASSETS} from '../src/modules/yasser/science/science-data.js';
import {YASSER_SCIENCE_VISUAL_ASSETS,YASSER_SCIENCE_VISUAL_QUESTIONS} from '../src/modules/yasser/science/science-visuals.js';
import {filterScienceQuestionsByChapter} from '../src/modules/yasser/science/science-chapters.js';

test('shared question record is subject-agnostic and validates answers',()=>{
  const science=createQuestionRecord({id:'science:q1',subjectId:'science',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',unitId:'u1',chapterId:'c1',topicId:'cells',conceptId:'cell',type:'choice',difficulty:1,prompt:'ما الوحدة الأساسية في المخلوق الحي؟',choices:['الخلية','العضو'],answer:'الخلية',sources:[{label:'اختبار تدريبي',authority:'training-model'}]});
  const math=createQuestionRecord({id:'math:q1',subjectId:'math',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',unitId:'u1',chapterId:'c1',topicId:'numbers',conceptId:'place-value',type:'choice',difficulty:1,prompt:'اختر القيمة المنزلية الصحيحة.',choices:['10','100'],answer:'10',sources:[{label:'ورقة عمل',authority:'worksheet'}]});
  const bank=createQuestionBank([science,math],{id:'family-bank',strict:true});
  assert.equal(bank.questions.length,2);assert.equal(queryQuestionBank(bank,{subjectId:'science'}).length,1);assert.equal(queryQuestionBank(bank,{sourceAuthority:'worksheet'})[0].subjectId,'math');
  const invalid=createQuestionRecord({...science,id:'bad',answer:'إجابة غير موجودة'});assert.equal(validateQuestionRecord(invalid).ok,false);
});

test('question bank detects normalized exact duplicates instead of counting reposts twice',()=>{
  const base={subjectId:'science',gradeId:'grade-6',termId:'term-1',unitId:'u1',chapterId:'c1',conceptId:'cell',type:'choice',difficulty:1,choices:['الخلية','النسيج'],answer:'الخلية'};
  const a=createQuestionRecord({...base,id:'a',prompt:'ما هي الوحدة الأساسية؟',sources:[{label:'المصدر أ',authority:'training-model'}]});
  const b=createQuestionRecord({...base,id:'b',prompt:'ما هي الوحدة الأساسية ؟',sources:[{label:'المصدر ب',authority:'teacher-model'}]});
  const duplicates=findExactQuestionDuplicates([a,b]);assert.equal(duplicates.length,1);assert.deepEqual([...duplicates[0].ids],['a','b']);
});

test('expanded science collection is verified, source-backed and duplicate-free',()=>{
  assert.equal(YASSER_SCIENCE_VISUAL_QUESTIONS.length,18);
  assert.ok(YASSER_SCIENCE_COLLECTED_ALL.length>=100,`collected=${YASSER_SCIENCE_COLLECTED_ALL.length}`);
  assert.ok(YASSER_SCIENCE_COLLECTED_ALL.every(question=>question.verified));
  assert.ok(YASSER_SCIENCE_COLLECTED_ALL.every(question=>Array.isArray(question.sources)&&question.sources.length>=1));
  assert.ok(YASSER_SCIENCE_COLLECTED_ALL.every(question=>validateQuestionRecord(question).ok));
  assert.equal(findExactQuestionDuplicates(YASSER_SCIENCE_COLLECTED_ALL).length,0);
});

test('chapter one has a substantial visual bank with clean resolvable assets',()=>{
  const chapterOne=filterScienceQuestionsByChapter(YASSER_SCIENCE_PLAYABLE_QUESTIONS,'chapter-1-cells');
  const visualQuestions=chapterOne.filter(question=>question.assetId);
  const assetIds=new Set(visualQuestions.map(question=>question.assetId));
  const assets={...YASSER_SCIENCE_ASSETS,...YASSER_SCIENCE_VISUAL_ASSETS};
  assert.ok(chapterOne.length>=100,`chapter one only has ${chapterOne.length} questions`);
  assert.ok(assetIds.size>=18,`chapter one only has ${assetIds.size} visual assets`);
  assert.ok(visualQuestions.length>=20,`chapter one only has ${visualQuestions.length} visual questions`);
  assert.ok([...assetIds].every(id=>Boolean(assets[id])),`missing visual asset in ${[...assetIds].filter(id=>!assets[id]).join(', ')}`);
});

test('existing science data and collected source-backed questions share one reusable bank',()=>{
  assert.equal(YASSER_SCIENCE_QUESTION_BANK.validation.ok,true,YASSER_SCIENCE_QUESTION_BANK.validation.errors.join('\n'));
  assert.equal(YASSER_SCIENCE_QUESTION_BANK.questions.length,YASSER_SCIENCE_QUESTIONS.length+YASSER_SCIENCE_COLLECTED_ALL.length);
  const coverage=getQuestionBankCoverage(YASSER_SCIENCE_QUESTION_BANK);
  assert.equal(coverage.bySubject.science,YASSER_SCIENCE_QUESTION_BANK.questions.length);
  const unitTwoCoverage=coverage.byUnit['unit-2-life-processes']||0;
  assert.ok(unitTwoCoverage>=22,`unit 2 coverage=${unitTwoCoverage}`);
  assert.equal(coverage.byUnit['unit-1-diversity-of-life'],YASSER_SCIENCE_QUESTION_BANK.questions.length-unitTwoCoverage);
  assert.ok((coverage.byChapter['chapter-1-cells']||0)>78);
  assert.ok((coverage.byChapter['chapter-2-cell-heredity']||0)>0);
  assert.ok((coverage.byChapter['chapter-3-plants-microorganisms']||0)>=22);
});
