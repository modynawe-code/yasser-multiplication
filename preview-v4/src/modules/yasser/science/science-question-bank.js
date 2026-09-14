import {createQuestionBank,createQuestionRecord} from '../../../shared/question-bank/index.js';
import {YASSER_SCIENCE_QUESTIONS,YASSER_SCIENCE_SCOPE} from './science-data.js';
import {YASSER_SCIENCE_COLLECTED_QUESTIONS} from './science-collected-questions.js';
import {YASSER_SCIENCE_COLLECTED_QUESTIONS_BATCH2} from './science-collected-questions-batch2.js';

const CHAPTER_BY_LEGACY_UNIT=Object.freeze({
  cells:'chapter-1-cells',
  organization:'chapter-1-cells',
  'cell-processes':'chapter-1-cells',
  division:'chapter-2-cell-heredity',
  heredity:'chapter-2-cell-heredity'
});

const TOPIC_BY_LEGACY_UNIT=Object.freeze({
  cells:'cells',
  organization:'organization-levels',
  'cell-processes':'cell-processes',
  division:'cell-division',
  heredity:'heredity'
});

function sourceAuthority(source={}){
  if(source.kind==='uploaded-summary')return 'study-summary';
  if(source.kind==='uploaded-exam')return 'user-upload';
  return 'training-model';
}

function adaptScienceQuestion(question){
  const source=question.source||{};
  return createQuestionRecord({
    id:`science:${question.id}`,
    subjectId:'science',
    gradeId:'grade-6',
    termId:'term-1',
    curriculumYear:YASSER_SCIENCE_SCOPE.curriculumYear,
    unitId:'unit-1-diversity-of-life',
    chapterId:CHAPTER_BY_LEGACY_UNIT[question.unit]||'chapter-1-cells',
    topicId:TOPIC_BY_LEGACY_UNIT[question.unit]||question.unit,
    conceptId:question.concept,
    type:question.type,
    difficulty:question.difficulty,
    prompt:question.prompt,
    choices:question.choices,
    answer:question.answer,
    explanation:question.feedback,
    assetId:question.assetId||'',
    tags:['yasser','science','grade-6','term-1','legacy-runtime'],
    sources:[{
      id:`legacy:${question.id}`,
      label:source.label||'',
      year:(source.label||'').match(/14\d{2}/)?.[0]||'',
      authority:sourceAuthority(source),
      kind:source.kind||'legacy-source',
      page:source.page??null
    }],
    verified:true,
    legacy:{questionId:question.id,unit:question.unit,concept:question.concept}
  });
}

export const YASSER_SCIENCE_RUNTIME_QUESTIONS=Object.freeze(YASSER_SCIENCE_QUESTIONS.map(adaptScienceQuestion));
export const YASSER_SCIENCE_COLLECTED_ALL=Object.freeze([
  ...YASSER_SCIENCE_COLLECTED_QUESTIONS,
  ...YASSER_SCIENCE_COLLECTED_QUESTIONS_BATCH2
]);
export const YASSER_SCIENCE_SHARED_QUESTIONS=Object.freeze([
  ...YASSER_SCIENCE_RUNTIME_QUESTIONS,
  ...YASSER_SCIENCE_COLLECTED_ALL
]);

export const YASSER_SCIENCE_QUESTION_BANK=createQuestionBank(YASSER_SCIENCE_SHARED_QUESTIONS,{
  id:'science-grade6-term1',
  version:1,
  strict:true
});
