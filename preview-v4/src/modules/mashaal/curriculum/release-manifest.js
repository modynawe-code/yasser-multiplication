const SELS='saudi-early-learning-standards-3-6-2015';
const RECITATION_SOURCE='kfgqpc-ibrahim-al-akhdar-hafs';

export const MASHAAL_KG3_RELEASE_MANIFEST = Object.freeze({
  foundation:Object.freeze({status:'verified',sourceId:'saudi-curriculum-guide-2025'}),
  detailedSkillMap:Object.freeze({status:'verified',sourceId:SELS,totalSkills:25}),
  activityContent:Object.freeze({status:'verified',sourceId:SELS,totalSkills:25,readySkills:24,blockedSkills:1}),
  quranIslamicContent:Object.freeze({status:'verified-with-media-blocker',sourceId:SELS,recitationSourceId:RECITATION_SOURCE,readySkills:1,blockedSkills:1,blocker:'approved-human-recitation-audio'}),
  nationalSocialContent:Object.freeze({status:'verified',sourceId:SELS,readySkills:3,blockedSkills:0}),
  requiredMedia:Object.freeze({status:'source-approved-asset-pending',sourceId:RECITATION_SOURCE,syntheticRecitationAllowed:false})
});
