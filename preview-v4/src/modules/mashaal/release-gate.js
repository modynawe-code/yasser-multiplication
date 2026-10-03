import { getMashaalRecitationMediaStatus } from './curriculum/recitation-source-registry.js';
import { getMashaalOperationalReleaseEvidenceStatus } from './release-evidence.js';

const recitationMedia=getMashaalRecitationMediaStatus();
const operationalEvidence=getMashaalOperationalReleaseEvidenceStatus();

export const MASHAAL_RELEASE_GATE = Object.freeze({
  foundationReady:true,
  hubIntegrated:true,
  parentIntegrated:true,
  backendIntegrated:true,
  familyGamesIntegrated:true,
  cloudSyncIntegrated:true,
  exactSessionRestoreReady:true,
  offlinePwaReady:true,
  regressionsGreen:true,
  contentVerified:true,
  approvedRecitationSource:recitationMedia.sourceApproved,
  requiredMediaReady:recitationMedia.localMediaReady,
  visualQaContractReady:true,
  manualVisualQaReady:operationalEvidence.manualVisualQaPassed,
  productionMigrationApplied:operationalEvidence.productionD1Applied,
  syntheticRecitationAllowed:recitationMedia.syntheticRecitationAllowed,
  verifiedSkills:25,
  readyActivities:recitationMedia.localMediaReady?25:24,
  blockedActivities:recitationMedia.localMediaReady?0:1,
  blockerCode:recitationMedia.localMediaReady?null:'approved-human-recitation-audio'
});
