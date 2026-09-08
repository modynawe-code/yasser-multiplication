const SHA256_RE=/^[a-f0-9]{64}$/i;

// Source of truth for recitation files that are physically bundled with the PWA.
// Do not add an entry until the local file has been copied from an approved source
// and its SHA-256 has been verified.
export const MASHAAL_RECITATION_MEDIA=Object.freeze([]);

export function validateMashaalRecitationAsset(asset){
  const errors=[];
  if(!asset||typeof asset!=='object')return Object.freeze({valid:false,errors:Object.freeze(['asset-required'])});
  if(typeof asset.id!=='string'||!asset.id.trim())errors.push('id-required');
  if(typeof asset.sourceId!=='string'||!asset.sourceId.trim())errors.push('source-id-required');
  if(typeof asset.localPath!=='string'||!asset.localPath.startsWith('./assets/recitation/'))errors.push('local-path-invalid');
  if(typeof asset.sha256!=='string'||!SHA256_RE.test(asset.sha256))errors.push('sha256-required');
  if(!Number.isInteger(asset.surahNumber)||asset.surahNumber<1||asset.surahNumber>114)errors.push('surah-number-invalid');
  if(typeof asset.surahNameAr!=='string'||!asset.surahNameAr.trim())errors.push('surah-name-required');
  if(asset.humanVoice!==true)errors.push('human-voice-required');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function listVerifiedMashaalRecitationAssets(sourceId){
  return MASHAAL_RECITATION_MEDIA.filter(asset=>(!sourceId||asset.sourceId===sourceId)&&validateMashaalRecitationAsset(asset).valid);
}

export function getMashaalRecitationAsset(assetId){
  const asset=MASHAAL_RECITATION_MEDIA.find(item=>item.id===assetId);
  return asset&&validateMashaalRecitationAsset(asset).valid?asset:null;
}
