export const YASSER_MATH_PLAYLIST_ID='PLyoodbH_5mVJEpMP0ZPJcyA9bFkTqbESX';

export const YASSER_MATH_COURSE=Object.freeze({
  title:'رياضيات سادس ابتدائي',
  subtitle:'الفصل الدراسي الأول',
  teacher:'حسن القرني',
  totalLessons:34,
  approximateMinutes:420
});

export const YASSER_MATH_CHAPTERS=Object.freeze([
  Object.freeze({
    id:'chapter-1',
    number:1,
    title:'الجبر: الأنماط العددية والدوال',
    lessons:Object.freeze([
      'الخطوات الأربع لحل المسألة',
      'العوامل الأولية',
      'القوى والأسس',
      'ترتيب العمليات',
      'الجبر: المتغيرات والعبارات',
      'الجبر: الدوال',
      'خطة حل المسألة: التخمين والتحقق',
      'الجبر: المعادلات'
    ])
  }),
  Object.freeze({
    id:'chapter-2',
    number:2,
    title:'الإحصاء والتمثيلات البيانية',
    lessons:Object.freeze([
      'خطة حل المسألة: إنشاء جدول',
      'التمثيل بالأعمدة وبالخطوط',
      'التمثيل بالنقاط',
      'المتوسط الحسابي',
      'الوسيط والمنوال والمدى'
    ])
  }),
  Object.freeze({
    id:'chapter-3',
    number:3,
    title:'العمليات على الكسور العشرية',
    lessons:Object.freeze([
      'تمثيل الكسور العشرية',
      'مقارنة الكسور العشرية وترتيبها',
      'تقريب الكسور العشرية',
      'تقدير ناتج جمع الكسور العشرية وطرحها',
      'جمع الكسور العشرية وطرحها',
      'ضرب الكسور العشرية في أعداد كلية',
      'ضرب الكسور العشرية',
      'قسمة الكسور العشرية على أعداد كلية',
      'القسمة على كسر عشري',
      'خطة حل المسألة: التحقق من معقولية الإجابة'
    ])
  }),
  Object.freeze({
    id:'chapter-4',
    number:4,
    title:'الكسور الاعتيادية والكسور العشرية',
    lessons:Object.freeze([
      'القاسم المشترك الأكبر',
      'تبسيط الكسور الاعتيادية',
      'الأعداد الكسرية والكسور غير الفعلية',
      'خطة حل المسألة: إنشاء قائمة منظمة',
      'المضاعف المشترك الأصغر',
      'مقارنة الكسور الاعتيادية وترتيبها',
      'كتابة الكسور العشرية في صورة كسور اعتيادية',
      'كتابة الكسور الاعتيادية في صورة كسور عشرية'
    ])
  }),
  Object.freeze({
    id:'chapter-5',
    number:5,
    title:'القياس: الطول والكتلة والسعة',
    lessons:Object.freeze([
      'الطول في النظام المتري',
      'الكتلة والسعة في النظام المتري',
      'مهارة حل المسألة: استعمال مقياس مرجعي',
      'التحويل بين الوحدات في النظام المتري'
    ])
  })
]);

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

function normalizeArabic(value){
  return String(value||'')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/[إأآ]/g,'ا')
    .replace(/ة/g,'ه')
    .replace(/ى/g,'ي')
    .replace(/[^\u0600-\u06FF0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

const curriculumIndex=Object.freeze(
  YASSER_MATH_CHAPTERS.flatMap(chapter=>chapter.lessons.map((title,lessonIndex)=>Object.freeze({
    chapterId:chapter.id,
    chapterNumber:chapter.number,
    chapterTitle:chapter.title,
    lessonIndex,
    title,
    normalized:normalizeArabic(title)
  }))).sort((a,b)=>b.normalized.length-a.normalized.length)
);

const aliases=Object.freeze([
  Object.freeze({needle:normalizeArabic('استعمل مقياس مرجعي'),title:'مهارة حل المسألة: استعمال مقياس مرجعي'}),
  Object.freeze({needle:normalizeArabic('إنشاء قائمة منظمة'),title:'خطة حل المسألة: إنشاء قائمة منظمة'}),
  Object.freeze({needle:normalizeArabic('إنشاء جدول'),title:'خطة حل المسألة: إنشاء جدول'}),
  Object.freeze({needle:normalizeArabic('التخمين والتحقق'),title:'خطة حل المسألة: التخمين والتحقق'}),
  Object.freeze({needle:normalizeArabic('التحقق من معقولية الإجابة'),title:'خطة حل المسألة: التحقق من معقولية الإجابة'})
]);

export function classifyYasserMathLessonTitle(title){
  const normalized=normalizeArabic(title);
  if(!normalized)return null;
  let match=curriculumIndex.find(item=>normalized.includes(item.normalized));
  if(!match){
    const alias=aliases.find(item=>normalized.includes(item.needle));
    if(alias)match=curriculumIndex.find(item=>item.title===alias.title);
  }
  return match||null;
}
