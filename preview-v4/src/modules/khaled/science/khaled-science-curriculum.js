import {SCIENCE_C1} from './khaled-science-c1.js';
import {SCIENCE_C2} from './khaled-science-c2.js';
import {SCIENCE_C3} from './khaled-science-c3.js';
import {SCIENCE_C4} from './khaled-science-c4.js';
import {SCIENCE_C5} from './khaled-science-c5.js';

export const KHALED_SCIENCE_CHAPTERS=Object.freeze([SCIENCE_C1,SCIENCE_C2,SCIENCE_C3,SCIENCE_C4,SCIENCE_C5]);
export const KHALED_SCIENCE_LESSONS=Object.freeze(KHALED_SCIENCE_CHAPTERS.flatMap(chapter=>chapter.lessons.map(lesson=>Object.freeze({...lesson,chapterId:chapter.id,chapter:`الفصل ${chapter.number}`,chapterTitle:chapter.title}))));
export const KHALED_SCIENCE_ACTIVITY_COUNT=KHALED_SCIENCE_LESSONS.reduce((sum,lesson)=>sum+lesson.activities.length,0);
export function getKhaledScienceLesson(id){return KHALED_SCIENCE_LESSONS.find(lesson=>lesson.id===id)||null;}
export function getKhaledScienceChapter(id){return KHALED_SCIENCE_CHAPTERS.find(chapter=>chapter.id===id)||null;}
