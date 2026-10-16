const REQUIRED_READY_FLAGS=Object.freeze([
  'foundationReady',
  'hubIntegrated',
  'parentIntegrated',
  'backendIntegrated',
  'familyGamesIntegrated',
  'cloudSyncIntegrated',
  'exactSessionRestoreReady',
  'offlinePwaReady',
  'regressionsGreen',
  'contentVerified',
  'approvedRecitationSource',
  'requiredMediaReady',
  'visualQaContractReady',
  'manualVisualQaReady',
  'productionMigrationApplied'
]);

export function getMashaalReleaseBlockers(gate){
  const blockers=[];
  if(!gate?.requiredMediaReady)blockers.push('approved-human-recitation-audio');
  if(!gate?.manualVisualQaReady)blockers.push('manual-galaxy-tab-visual-qa');
  if(!gate?.productionMigrationApplied)blockers.push('controlled-production-d1-migration');
  for(const flag of REQUIRED_READY_FLAGS){
    if(['requiredMediaReady','manualVisualQaReady','productionMigrationApplied'].includes(flag))continue;
    if(!gate?.[flag])blockers.push(`gate:${flag}`);
  }
  if(gate?.syntheticRecitationAllowed)blockers.push('synthetic-quran-recitation-enabled');
  return Object.freeze([...new Set(blockers)]);
}

export function isMashaalReleaseReady(gate){
  return getMashaalReleaseBlockers(gate).length===0;
}
