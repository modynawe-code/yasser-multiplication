export const HUMAN_VOICE_POLICY=Object.freeze({
  schemaVersion:1,
  locale:'ar-SA',
  runtimeMode:'migration',
  releaseMode:'human-only',
  humanAssetFormat:'mp3',
  syntheticFallbackAllowedDuringMigration:true,
  requireCompleteHumanCoverageForRelease:true
});

export function isHumanOnlyVoiceMode(mode){
  return mode==='human-only';
}
