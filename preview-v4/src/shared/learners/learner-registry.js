export const LEARNER_REGISTRY = Object.freeze({
  yasser:Object.freeze({
    id:'yasser',
    displayName:'ياسر',
    stage:'grade6',
    curriculumIds:Object.freeze(['multiplication-1-10']),
    module:'yasser',
    theme:'yasser',
    presentation:Object.freeze({
      subtitle:'جدول الضرب 1–10',
      summary:'تدريب • اختبار • إتقان',
      symbol:'× ÷',
      stageLabel:'سادس ابتدائي',
      homeVariant:'older-child'
    })
  }),
  khaled:Object.freeze({
    id:'khaled',
    displayName:'خالد',
    stage:'grade1',
    curriculumIds:Object.freeze(['saudi-grade1-math']),
    module:'khaled',
    theme:'khaled',
    presentation:Object.freeze({
      subtitle:'رياضيات أول ابتدائي',
      summary:'أعداد • عمليات • قياس • أشكال • نقود',
      symbol:'+ −',
      stageLabel:'أول ابتدائي',
      homeVariant:'early-reader'
    })
  }),
  mashaal:Object.freeze({
    id:'mashaal',
    displayName:'مشاعل',
    stage:'kg3',
    curriculumIds:Object.freeze(['saudi-kg3']),
    module:'mashaal',
    theme:'mashaal',
    presentation:Object.freeze({
      subtitle:'روضة ثالثة',
      summary:'لغة • تفكير • مشاعر • صحة • وطني',
      symbol:'✿',
      fallbackVisual:'preschool-learning',
      stageLabel:'روضة ثالثة',
      homeVariant:'preschool'
    })
  })
});

export function getLearnerProfile(learnerId){
  return LEARNER_REGISTRY[String(learnerId||'').trim().toLowerCase()]||null;
}

export function listLearnerProfiles(){
  return Object.values(LEARNER_REGISTRY);
}

export function isRegisteredLearner(learnerId){
  return Boolean(getLearnerProfile(learnerId));
}
