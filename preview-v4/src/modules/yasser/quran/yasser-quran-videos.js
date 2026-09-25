import {createVideoCourse} from '../../../shared/video-course/video-course.js';

const PLAYLIST_ID='PLSHONothJlCHJyUn3yaMpoRmXZEZXEQ5q';

function normalizeArabicDigits(value){
  return String(value||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}
function cleanQalamTitle(raw,lesson){
  const text=normalizeArabicDigits(raw)
    .replace(/[_]+/g,'-')
    .replace(/\s+/g,' ')
    .trim();
  const range=text.match(/(?:من|الآيات?)\s*\(?\s*(\d+)\s*[-–—]\s*(\d+)\s*\)?/i)
    ||text.match(/\(\s*(\d+)\s*[-–—]\s*(\d+)\s*\)/);
  if(range)return `الآيات ${range[1]}–${range[2]}`;
  let cleaned=text
    .replace(/تفسير\s+سورة\s+القلم/gi,'')
    .replace(/(?:للشيخ|الشيخ)\s+محمد\s+العريفي/gi,'')
    .replace(/أ\.?\s*أميرة\s+حميدة/gi,'')
    .replace(/^\s*[-–—|]+|[-–—|]+\s*$/g,'')
    .trim();
  return cleaned||`الدرس ${lesson.number}`;
}

const qalamCourse=createVideoCourse({
  id:'yasser-quran-qalam',
  storageKey:'family.yasser.quran.qalam-video.v1',
  title:'تفسير سورة القلم',
  subtitle:'6 دروس فيديو • الشيخ محمد العريفي',
  kicker:'القرآن الكريم • تفسير',
  playlistId:PLAYLIST_ID,
  lessonCount:6,
  themeClass:'fvc-theme-quran',
  cleanTitle:cleanQalamTitle
});

export function openYasserQalamVideoCourse({onBack}={}){
  qalamCourse.open({onBack});
}
