const SELS='saudi-early-learning-standards-3-6-2015';
const MOE='saudi-moe-early-childhood-current';

const direct=(indicatorRefs,description)=>Object.freeze({
  status:'direct-indicator',
  sourceId:SELS,
  indicatorRefs:Object.freeze([...indicatorRefs]),
  indicator:description
});

export const MASHAAL_KG3_SKILL_PROVENANCE = Object.freeze({
  'listen-follow-simple-directions':direct(['LL 1.1.2'],'Listening and Speaking: multi-step instructions'),
  'oral-vocabulary-expression':direct(['LL 1.1.1','LL 1.5.1','LL 1.5.2'],'Purposeful language and conversation'),
  'story-sequencing':direct(['LL 2.5.1','LL 2.5.5'],'Story elements, sequence and retelling'),
  'sound-awareness':direct(['LL 1.1.3'],'Discriminate Arabic sounds, syllables and rhyme'),
  'letter-sound-readiness':direct(['LL 2.4.1','LL 2.4.2','LL 2.4.3'],'Alphabet awareness and letter-sound matching'),
  'prewriting-fine-motor':direct(['HP 2.2'],'Fine-motor control, hand-eye coordination and writing tools'),

  'count-and-quantity':direct(['CK 1.1.7'],'Concepts of Numbers and Mathematical Operations'),
  'compare-quantities':direct(['CK 1.1.8'],'Compare concrete groups using equal, more and fewer relationships'),
  'classify-sort':direct(['CK 1.2.1'],'Sort and classify by one or more attributes'),
  'patterns':direct(['CK 1.2.2'],'Recognize, describe, extend and create patterns'),
  'shapes-space':direct(['CK 1.4.5','CK 1.4.6','CK 1.4.7'],'Mathematics: Geometry and Spatial Sense'),
  'observe-reason':direct(['CK 2.1.1','CK 2.1.2','CK 2.1.3','CK 2.1.4','CK 2.1.5','AL 3.0.1','AL 3.0.2'],'Inquiry, inference and problem solving'),

  'recognize-emotions':direct(['SE 1.3.2','SE 1.3.3','SE 1.3.4'],'Identify, understand and share emotions'),
  'express-needs-feelings':direct(['SE 1.3.1','SE 1.3.2'],'Communicate feelings and their causes appropriately'),
  'turn-taking-sharing':direct(['SE 2.2.2','SE 2.2.3','SE 2.2.4','SE 2.2.5'],'Cooperative play, peer support and conflict resolution'),
  'seek-help-self-regulation':direct(['SE 1.2.1','SE 1.2.2','SE 1.2.3','SE 1.2.4','SE 1.2.5','SE 1.2.6','SE 2.2.3','SE 2.2.4'],'Self-regulation and seeking assistance'),

  'healthy-habits':direct(['HP 1.1.1','HP 1.1.2','HP 1.1.3','HP 1.1.4','HP 1.1.5','HP 1.1.6'],'Self-care, hygiene, disease prevention and healthy food'),
  'personal-safety':direct(['HP 1.2'],'Safety rules, emergencies and hazard awareness'),
  'gross-motor':direct(['HP 2.1.1','HP 2.1.2','HP 2.1.3'],'Gross-motor control, object manipulation and balance'),
  'fine-motor':direct(['HP 2.2'],'Fine-motor control and hand-eye coordination'),

  'listen-repeat':direct(['IE 1.0.2','IE 1.0.3'],'Participate in supplications and recite some short suras'),
  'islamic-values-situations':direct(['IE 2.0.1','IE 2.0.2','IE 2.0.3','IE 2.0.4'],'Islamic etiquette, respect, morals and respect for the Quran'),

  'family-community':direct(['P 1.1.1','P 1.2.1','P 1.2.2','P 1.2.3'],'Social-group membership and community participation'),
  'saudi-identity-belonging':direct(['P 1.1.3','P 1.2.4','P 1.2.5','P 1.2.6'],'Arabic/Saudi identity, homeland and national knowledge'),
  'places-roles':direct(['P 1.1.4'],'Important roles and figures in the community')
});

export const MASHAAL_KG3_SOURCE_POLICY = Object.freeze({
  currentPolicySourceId:MOE,
  standardsSourceId:SELS,
  requiredSkillStatus:'direct-indicator',
  activityReleaseRequiresSourceBinding:true
});

export function getMashaalKg3SkillProvenance(skillId){
  return MASHAAL_KG3_SKILL_PROVENANCE[skillId]||null;
}

export function summarizeMashaalKg3Provenance(){
  return Object.values(MASHAAL_KG3_SKILL_PROVENANCE).reduce((summary,item)=>{
    summary.total+=1;
    summary[item.status]=(summary[item.status]||0)+1;
    return summary;
  },{total:0,'direct-indicator':0});
}
