import {createQuestionBank,createQuestionRecord} from '../../../shared/question-bank/index.js';
import {YASSER_SCIENCE_QUESTIONS,YASSER_SCIENCE_SCOPE} from './science-data.js';
import {YASSER_SCIENCE_COLLECTED_QUESTIONS} from './science-collected-questions.js';
import {YASSER_SCIENCE_COLLECTED_QUESTIONS_BATCH2} from './science-collected-questions-batch2.js';
import {YASSER_SCIENCE_VISUAL_QUESTIONS} from './science-visuals.js';
import {YASSER_SCIENCE_UNIT2_QUESTIONS} from './science-unit2-questions.js';
import {YASSER_SCIENCE_UNIT2_QUESTIONS_BATCH2} from './science-unit2-questions-batch2.js';
import {YASSER_SCIENCE_UNIT2_QUESTIONS_BATCH3} from './science-unit2-questions-batch3.js';
import {YASSER_SCIENCE_UNIT2_VISUAL_QUESTIONS} from './science-unit2-visual-questions.js';
import {YASSER_SCIENCE_UNIT3_QUESTIONS} from './science-unit3-questions.js';
import {YASSER_SCIENCE_UNIT3_VISUAL_QUESTIONS} from './science-unit3-visual-questions.js';

const CHAPTER_BY_LEGACY_UNIT=Object.freeze({cells:'chapter-1-cells',organization:'chapter-1-cells','cell-processes':'chapter-1-cells',division:'chapter-2-cell-heredity',heredity:'chapter-2-cell-heredity'});
const TOPIC_BY_LEGACY_UNIT=Object.freeze({cells:'cells',organization:'organization-levels','cell-processes':'cell-processes',division:'cell-division',heredity:'heredity'});
const RUNTIME_UNIT_BY_TOPIC=Object.freeze({
  'cell-theory':'cells','cell-chemistry':'cells','plant-animal-cell':'cells','organization-levels':'organization','cell-processes':'cell-processes',
  'plant-life-processes':'plant-processes','microorganism-life-processes':'microorganisms','body-processes':'body-processes','movement-senses':'movement-senses',
  'food-relations':'food-relations','ecosystems':'ecosystems','earth-resources':'earth-resources','resource-protection':'resource-protection'
});
const RUNTIME_OVERRIDES=Object.freeze({
  'science:collected:scientists-sequence-01':Object.freeze({type:'choice',choices:Object.freeze(['هوك → ليفنهوك → براون → شلايدن → شفان','ليفنهوك → هوك → شفان → براون → شلايدن','براون → هوك → ليفنهوك → شفان → شلايدن','هوك → براون → ليفنهوك → شفان → شلايدن']),answer:'هوك → ليفنهوك → براون → شلايدن → شفان'}),
  'science:collected:photosynthesis-respiration-opposites-01':Object.freeze({type:'choice',choices:Object.freeze(['البناء الضوئي ينتج الجلوكوز والأكسجين، والتنفس الخلوي يستخدمهما ويطلق ثاني أكسيد الكربون والماء والطاقة.','العمليتان تستخدمان الأكسجين فقط وتنتجان الجلوكوز.','البناء الضوئي والتنفس الخلوي عمليتان متماثلتان تمامًا.','التنفس الخلوي يصنع الغذاء من الماء وثاني أكسيد الكربون باستخدام الضوء.']),answer:'البناء الضوئي ينتج الجلوكوز والأكسجين، والتنفس الخلوي يستخدمهما ويطلق ثاني أكسيد الكربون والماء والطاقة.'})
});
function sourceAuthority(source={}){if(source.kind==='uploaded-summary')return 'study-summary';if(source.kind==='uploaded-exam')return 'user-upload';return 'training-model';}
function adaptScienceQuestion(question){const source=question.source||{};return createQuestionRecord({id:`science:${question.id}`,subjectId:'science',gradeId:'grade-6',termId:'term-1',curriculumYear:YASSER_SCIENCE_SCOPE.curriculumYear,unitId:'unit-1-diversity-of-life',chapterId:CHAPTER_BY_LEGACY_UNIT[question.unit]||'chapter-1-cells',topicId:TOPIC_BY_LEGACY_UNIT[question.unit]||question.unit,conceptId:question.concept,type:question.type,difficulty:question.difficulty,prompt:question.prompt,choices:question.choices,answer:question.answer,explanation:question.feedback,assetId:question.assetId||'',tags:['yasser','science','grade-6','term-1','legacy-runtime'],sources:[{id:`legacy:${question.id}`,label:source.label||'',year:(source.label||'').match(/14\d{2}/)?.[0]||'',authority:sourceAuthority(source),kind:source.kind||'legacy-source',page:source.page??null}],verified:true,legacy:{questionId:question.id,unit:question.unit,concept:question.concept}});}
function adaptCollectedForRuntime(question){const override=RUNTIME_OVERRIDES[question.id]||{};const source=question.sources?.[0]||{};return Object.freeze({id:question.id,unit:RUNTIME_UNIT_BY_TOPIC[question.topicId]||'cells',concept:question.conceptId,type:override.type||question.type,difficulty:question.difficulty||1,prompt:question.prompt,choices:[...(override.choices||question.choices||[])],answer:override.answer||question.answer,feedback:question.explanation||'راجع الإجابة الصحيحة ثم حاول مرة أخرى.',assetId:question.assetId||'',scienceUnitId:question.unitId||'',chapterId:question.chapterId||'',source:{label:source.label||'',kind:source.kind||'verified-source',page:source.page??null}});}

export const YASSER_SCIENCE_RUNTIME_QUESTIONS=Object.freeze(YASSER_SCIENCE_QUESTIONS.map(adaptScienceQuestion));
export const YASSER_SCIENCE_COLLECTED_ALL=Object.freeze([...YASSER_SCIENCE_COLLECTED_QUESTIONS,...YASSER_SCIENCE_COLLECTED_QUESTIONS_BATCH2,...YASSER_SCIENCE_VISUAL_QUESTIONS,...YASSER_SCIENCE_UNIT2_QUESTIONS,...YASSER_SCIENCE_UNIT2_QUESTIONS_BATCH2,...YASSER_SCIENCE_UNIT2_QUESTIONS_BATCH3,...YASSER_SCIENCE_UNIT2_VISUAL_QUESTIONS,...YASSER_SCIENCE_UNIT3_QUESTIONS,...YASSER_SCIENCE_UNIT3_VISUAL_QUESTIONS]);
export const YASSER_SCIENCE_SHARED_QUESTIONS=Object.freeze([...YASSER_SCIENCE_RUNTIME_QUESTIONS,...YASSER_SCIENCE_COLLECTED_ALL]);
export const YASSER_SCIENCE_PLAYABLE_QUESTIONS=Object.freeze([...YASSER_SCIENCE_QUESTIONS,...YASSER_SCIENCE_COLLECTED_ALL.map(adaptCollectedForRuntime)]);
export const YASSER_SCIENCE_QUESTION_BANK=createQuestionBank(YASSER_SCIENCE_SHARED_QUESTIONS,{id:'science-grade6-term1',version:1,strict:true});
