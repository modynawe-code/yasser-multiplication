export const HUMAN_VOICE_POLICY=Object.freeze({
  schemaVersion:2,
  locale:'ar-SA',
  runtimeMode:'natural-tts',
  releaseMode:'natural-tts',
  humanAssetFormat:'mp3',
  syntheticFallbackAllowedDuringMigration:true,
  requireCompleteHumanCoverageForRelease:false,
  preferredProvider:'cloud-tts',
  fallbackProviders:Object.freeze(['native-tts','browser-tts'])
});

export function isHumanOnlyVoiceMode(mode){
  return mode==='human-only';
}
