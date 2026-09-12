export const MASHAAL_KG3_DOMAINS = Object.freeze([
  Object.freeze({id:'language-communication',title:'اللغة والتواصل',childTitle:'حروفي وكلامي'}),
  Object.freeze({id:'cognitive-operations-general-knowledge',title:'العمليات المعرفية والمعلومات العامة',childTitle:'أفكر وأكتشف'}),
  Object.freeze({id:'social-emotional-development',title:'التطور الاجتماعي والعاطفي',childTitle:'أنا ومشاعري'}),
  Object.freeze({id:'health-physical-development',title:'الصحة والتطور البدني',childTitle:'صحتي وعالمي'}),
  Object.freeze({id:'quran-islamic-education',title:'القرآن الكريم والتربية الإسلامية',childTitle:'المسلم الصغير'}),
  Object.freeze({id:'national-social-studies',title:'الوطنية والدراسات الاجتماعية',childTitle:'وطني ومجتمعي'})
]);

export const MASHAAL_KG3_FOUNDATION = Object.freeze({
  learnerId:'mashaal',
  stage:'kg3',
  ageRange:'5-6',
  curriculumId:'saudi-kg3',
  pedagogy:Object.freeze({
    interactionOrder:Object.freeze(['listen','look','choose-or-manipulate','feedback','transfer']),
    childFacingGrades:false,
    preferredEvidence:Object.freeze(['digital-attempt','activity-completion','parent-observation']),
    masteryLabels:Object.freeze(['not-started','developing','mastered']),
    offScreenTransfer:true
  })
});
