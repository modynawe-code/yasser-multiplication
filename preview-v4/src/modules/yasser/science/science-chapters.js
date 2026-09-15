export const YASSER_SCIENCE_CHAPTERS=Object.freeze([
  Object.freeze({id:'chapter-1-cells',label:'الفصل 1: الخلايا',shortLabel:'الخلايا',unitIds:Object.freeze(['cells','organization','cell-processes'])}),
  Object.freeze({id:'chapter-2-cell-heredity',label:'الفصل 2: الخلية والوراثة',shortLabel:'الخلية والوراثة',unitIds:Object.freeze(['division','heredity'])}),
  Object.freeze({id:'chapter-3-plants-microorganisms',label:'الفصل 3: عمليات الحياة في النباتات والمخلوقات الحية الدقيقة',shortLabel:'النباتات والمخلوقات الحية الدقيقة',unitIds:Object.freeze(['plant-processes','microorganisms'])}),
  Object.freeze({id:'chapter-4-human-animals',label:'الفصل 4: عمليات الحياة في الإنسان والحيوان',shortLabel:'الإنسان والحيوان',unitIds:Object.freeze(['body-processes','movement-senses'])})
]);

export const YASSER_SCIENCE_UNITS=Object.freeze([
  Object.freeze({id:'unit-1-diversity-of-life',number:1,label:'الوحدة الأولى: تنوع الحياة',shortLabel:'تنوع الحياة',status:'review',currentChapterId:'chapter-1-cells',allowedChapterIds:Object.freeze(['chapter-1-cells'])}),
  Object.freeze({id:'unit-2-life-processes',number:2,label:'الوحدة الثانية: عمليات الحياة',shortLabel:'عمليات الحياة',status:'current',currentChapterId:'chapter-3-plants-microorganisms',allowedChapterIds:Object.freeze(['chapter-3-plants-microorganisms'])})
]);

export const DEFAULT_YASSER_SCIENCE_CHAPTER_ID='chapter-1-cells';
export const DEFAULT_YASSER_SCIENCE_UNIT_ID='unit-2-life-processes';

export function getScienceChapter(chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){return YASSER_SCIENCE_CHAPTERS.find(chapter=>chapter.id===chapterId)||YASSER_SCIENCE_CHAPTERS[0];}
export function getScienceUnit(unitId=DEFAULT_YASSER_SCIENCE_UNIT_ID){return YASSER_SCIENCE_UNITS.find(unit=>unit.id===unitId)||YASSER_SCIENCE_UNITS[1]||YASSER_SCIENCE_UNITS[0];}

export function filterScienceQuestionsByChapter(questions,chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){const chapter=getScienceChapter(chapterId);const allowed=new Set(chapter.unitIds);return (questions||[]).filter(question=>allowed.has(question.unit));}

function runtimeUnitsForScienceUnit(unitId){const unit=getScienceUnit(unitId);const allowedChapters=new Set(unit.allowedChapterIds);return new Set(YASSER_SCIENCE_CHAPTERS.filter(chapter=>allowedChapters.has(chapter.id)).flatMap(chapter=>chapter.unitIds));}
export function filterScienceQuestionsByUnit(questions,unitId=DEFAULT_YASSER_SCIENCE_UNIT_ID){const allowed=runtimeUnitsForScienceUnit(unitId);return (questions||[]).filter(question=>allowed.has(question.unit));}

function filterProgress(progress,allowed){const attempts=(progress?.attempts||[]).filter(attempt=>allowed.has(attempt.unit));const concepts={};let points=0;for(const attempt of attempts){const current=concepts[attempt.concept]||{correct:0,wrong:0,last:null};concepts[attempt.concept]={correct:current.correct+(attempt.isCorrect?1:0),wrong:current.wrong+(attempt.isCorrect?0:1),last:attempt.answeredAt||current.last};points+=Number(attempt.earned)||0;}return {...(progress||{}),attempts,concepts,points};}
export function filterScienceProgressByChapter(progress,chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){const chapter=getScienceChapter(chapterId);return filterProgress(progress,new Set(chapter.unitIds));}
export function filterScienceProgressByUnit(progress,unitId=DEFAULT_YASSER_SCIENCE_UNIT_ID){return filterProgress(progress,runtimeUnitsForScienceUnit(unitId));}
