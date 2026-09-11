export const MASHAAL_SOURCE_REGISTRY = Object.freeze({
  'saudi-curriculum-guide-2025':Object.freeze({
    authority:'Saudi Ministry of Education / National Curriculum Center',
    title:'Curriculum Guide - Fifth Edition',
    year:2025,
    sourceUrl:'https://www.moe.gov.sa/ar/education/generaleducation/StudyPlans/Documents/Curriculum-Guide-5th-Edition.pdf',
    role:'current-structure',
    supports:Object.freeze(['kg3-age-range','kg3-six-learning-domains'])
  }),
  'saudi-early-learning-standards-3-6-2015':Object.freeze({
    authority:'Saudi Ministry of Education / Tatweer Company for Educational Services / NAEYC',
    title:'Saudi Early Learning Standards: Children 3 to 6 Years Old',
    year:2015,
    sourceUrl:'https://www.naeyc.org/sites/default/files/globally-shared/downloads/PDFs/our-work/global/sels_3-6.pdf',
    role:'developmental-indicators',
    supports:Object.freeze([
      'language-early-literacy',
      'cognition-general-knowledge',
      'social-emotional-development',
      'health-physical-development',
      'islamic-education',
      'national-social-studies'
    ])
  }),
  'saudi-moe-early-childhood-current':Object.freeze({
    authority:'Saudi Ministry of Education',
    title:'Early Childhood',
    year:2026,
    sourceUrl:'https://www.moe.gov.sa/ar/education/generaleducation/Pages/Kindergarten.aspx',
    role:'current-policy',
    supports:Object.freeze(['developmental-standards-age-3-6','family-supported-learning'])
  })
});
