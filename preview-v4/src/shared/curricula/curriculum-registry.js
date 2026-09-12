export const CURRICULUM_REGISTRY = Object.freeze({
  'multiplication-1-10':Object.freeze({
    id:'multiplication-1-10',
    stage:'grade6',
    title:'جدول الضرب 1–10',
    module:'yasser'
  }),
  'saudi-grade1-math':Object.freeze({
    id:'saudi-grade1-math',
    stage:'grade1',
    title:'رياضيات الصف الأول',
    module:'khaled'
  }),
  'saudi-kg3':Object.freeze({
    id:'saudi-kg3',
    stage:'kg3',
    title:'رياض الأطفال – المستوى الثالث',
    ageRange:'5-6',
    authority:'Saudi Ministry of Education / National Curriculum Center',
    domains:Object.freeze([
      'quran-islamic-education',
      'national-social-studies',
      'social-emotional-development',
      'language-communication',
      'cognitive-operations-general-knowledge',
      'health-physical-development'
    ]),
    module:'mashaal'
  })
});

export function getCurriculum(curriculumId){
  return CURRICULUM_REGISTRY[String(curriculumId||'').trim()]||null;
}

export function listCurricula(){
  return Object.values(CURRICULUM_REGISTRY);
}
