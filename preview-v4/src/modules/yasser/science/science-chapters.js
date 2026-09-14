export const YASSER_SCIENCE_CHAPTERS=Object.freeze([
  Object.freeze({
    id:'chapter-1-cells',
    label:'الفصل 1: الخلايا',
    shortLabel:'الخلايا',
    unitIds:Object.freeze(['cells','organization','cell-processes'])
  }),
  Object.freeze({
    id:'chapter-2-cell-heredity',
    label:'الفصل 2: الخلية والوراثة',
    shortLabel:'الخلية والوراثة',
    unitIds:Object.freeze(['division','heredity'])
  })
]);

export const DEFAULT_YASSER_SCIENCE_CHAPTER_ID='chapter-1-cells';

export function getScienceChapter(chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){
  return YASSER_SCIENCE_CHAPTERS.find(chapter=>chapter.id===chapterId)||YASSER_SCIENCE_CHAPTERS[0];
}

export function filterScienceQuestionsByChapter(questions,chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){
  const chapter=getScienceChapter(chapterId);const allowed=new Set(chapter.unitIds);
  return (questions||[]).filter(question=>allowed.has(question.unit));
}

export function filterScienceProgressByChapter(progress,chapterId=DEFAULT_YASSER_SCIENCE_CHAPTER_ID){
  const chapter=getScienceChapter(chapterId);const allowed=new Set(chapter.unitIds);
  const attempts=(progress?.attempts||[]).filter(attempt=>allowed.has(attempt.unit));
  const concepts={};
  for(const attempt of attempts){
    const current=concepts[attempt.concept]||{correct:0,wrong:0,last:null};
    concepts[attempt.concept]={
      correct:current.correct+(attempt.isCorrect?1:0),
      wrong:current.wrong+(attempt.isCorrect?0:1),
      last:attempt.answeredAt||current.last
    };
  }
  return {...(progress||{}),attempts,concepts};
}
