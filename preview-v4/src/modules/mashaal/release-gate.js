import { getMashaalRecitationMediaStatus } from './curriculum/recitation-source-registry.js';

const recitationMedia=getMashaalRecitationMediaStatus();

export const MASHAAL_RELEASE_GATE = Object.freeze({
  foundationReady:true,
  hubIntegrated:true,
  parentIntegrated:true,
  backendIntegrated:true,
  regressionsGreen:true,
  contentVerified:true,
  approvedRecitationSource:recitationMedia.sourceApproved,
  requiredMediaReady:recitationMedia.localMediaReady,
  syntheticRecitationAllowed:recitationMedia.syntheticRecitationAllowed,
  verifiedSkills:25,
  readyActivities:24,
  blockedActivities:1,
  blockerCode:recitationMedia.localMediaReady?null:'approved-human-recitation-audio'
});
