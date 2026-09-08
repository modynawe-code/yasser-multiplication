const SELS='saudi-early-learning-standards-3-6-2015';
const MOE='saudi-moe-early-childhood-current';

const direct=(indicator)=>Object.freeze({status:'direct-indicator',sourceId:SELS,indicator});
const strategy=(section)=>Object.freeze({status:'adult-strategy',sourceId:SELS,indicator:section});
const strand=(section)=>Object.freeze({status:'standards-strand',sourceId:SELS,indicator:section});
const pending=(note)=>Object.freeze({status:'pending-indicator',sourceId:SELS,note});

export const MASHAAL_KG3_SKILL_PROVENANCE = Object.freeze({
  'listen-follow-simple-directions':pending('Locate the exact KG2-3 receptive-language indicator before release.'),
  'oral-vocabulary-expression':strand('Language and Early Literacy Development'),
  'story-sequencing':strategy('Reading strategies for adults working with 4 to 6 year olds: story elements and retelling'),
  'sound-awareness':strategy('Reading strategies for adults working with 4 to 6 year olds: sounds and wordplay'),
  'letter-sound-readiness':strategy('Reading strategies for adults working with 4 to 6 year olds: alphabetic principle'),
  'prewriting-fine-motor':pending('Writing is directly supported, but the exact fine-motor/prewriting KG2-3 indicator still needs matching.'),

  'count-and-quantity':pending('Locate the exact KG2-3 number-sense/counting indicator before release.'),
  'compare-quantities':pending('Locate the exact KG2-3 quantity-comparison indicator before release.'),
  'classify-sort':pending('Locate the exact KG2-3 classification/sorting indicator before release.'),
  'patterns':pending('Locate the exact KG2-3 pattern indicator before release.'),
  'shapes-space':direct('CK 1.4.5-CK 1.4.7, Mathematics: Geometry and Spatial Sense'),
  'observe-reason':pending('Map this broad implementation skill to one or more explicit cognition/approaches-to-learning indicators.'),

  'recognize-emotions':strand('Social-Emotional Development: Self / Emotional Expression'),
  'express-needs-feelings':strand('Social-Emotional Development: Self / Emotional Expression'),
  'turn-taking-sharing':strand('Social-Emotional Development: Relationships / Relationships with Peers'),
  'seek-help-self-regulation':direct('SE 1.2.1-SE 1.2.6, Self-Regulation'),

  'healthy-habits':strand('Health and Physical Development'),
  'personal-safety':strand('Health and Physical Development'),
  'gross-motor':strand('Health and Physical Development'),
  'fine-motor':strand('Health and Physical Development'),

  'listen-repeat':pending('Do not release specific Quran recitation/memorization content until the exact KG2-3 Islamic Education indicator is matched.'),
  'islamic-values-situations':strand('Islamic Education'),

  'family-community':strand('Nationalism and Social Studies: Sense of Community'),
  'saudi-identity-belonging':strand('Nationalism and Social Studies: Sense of Community / Identity and Citizenship'),
  'places-roles':pending('Community roles are plausible, but this implementation label needs an explicit SELS indicator match before release.')
});

export const MASHAAL_KG3_SOURCE_POLICY = Object.freeze({
  currentPolicySourceId:MOE,
  standardsSourceId:SELS,
  releasableStatuses:Object.freeze(['direct-indicator','standards-strand']),
  requiresIndicatorReview:Object.freeze(['adult-strategy','pending-indicator'])
});

export function getMashaalKg3SkillProvenance(skillId){
  return MASHAAL_KG3_SKILL_PROVENANCE[skillId]||null;
}

export function summarizeMashaalKg3Provenance(){
  return Object.values(MASHAAL_KG3_SKILL_PROVENANCE).reduce((summary,item)=>{
    summary.total+=1;
    summary[item.status]=(summary[item.status]||0)+1;
    return summary;
  },{total:0,'direct-indicator':0,'standards-strand':0,'adult-strategy':0,'pending-indicator':0});
}
