export const YASSER_MATH_PLAYLIST_ID='PLyoodbH_5mVJEpMP0ZPJcyA9bFkTqbESX';

export const YASSER_MATH_COURSE=Object.freeze({
  title:'رياضيات سادس ابتدائي',
  subtitle:'الفصل الدراسي الأول',
  teacher:'حسن القرني',
  totalLessons:34,
  approximateMinutes:420
});

const verifiedTitles=Object.freeze({
  0:'الخطوات الأربع لحل المسألة',
  1:'العوامل الأولية',
  2:'القوى والأسس'
});

export const YASSER_MATH_LESSONS=Object.freeze(
  Array.from({length:YASSER_MATH_COURSE.totalLessons},(_,index)=>Object.freeze({
    id:`math-f1-${String(index+1).padStart(2,'0')}`,
    playlistIndex:index,
    number:index+1,
    verifiedTitle:verifiedTitles[index]||''
  }))
);
