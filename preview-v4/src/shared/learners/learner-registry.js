export const LEARNER_REGISTRY = Object.freeze({
  yasser:Object.freeze({
    id:'yasser',
    displayName:'ياسر',
    stage:'grade6',
    curriculumIds:Object.freeze(['multiplication-1-10']),
    module:'yasser',
    theme:'yasser'
  }),
  khaled:Object.freeze({
    id:'khaled',
    displayName:'خالد',
    stage:'grade1',
    curriculumIds:Object.freeze(['saudi-grade1-math']),
    module:'khaled',
    theme:'khaled'
  }),
  mashaal:Object.freeze({
    id:'mashaal',
    displayName:'مشاعل',
    stage:'kg3',
    curriculumIds:Object.freeze(['saudi-kg3']),
    module:'mashaal',
    theme:'mashaal'
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
