import './recitation-media-data.js';

const SHA256_RE=/^[a-f0-9]{64}$/i;
const VERIFIED_MUSHAF_SOURCE_ID='kfgqpc-hafs-madinah-svg';
const BUNDLED_MUSHAF_PREFIX='./assets/recitation/kfqc-hafs-page-';
const media=globalThis.__FAMILY_LEARNING_RECITATION_MEDIA__;
export const MASHAAL_RECITATION_MEDIA=Object.freeze(Array.isArray(media)?[...media]:[]);

export function validateMashaalMushafPage(page){
  const errors=[];
  if(!page||typeof page!=='object')return Object.freeze({valid:false,errors:Object.freeze(['mushaf-page-required'])});
  if(page.sourceId!==VERIFIED_MUSHAF_SOURCE_ID)errors.push('mushaf-source-id-required');
  if(!Number.isInteger(page.pageNumber)||page.pageNumber<1||page.pageNumber>604)errors.push('mushaf-page-number-invalid');
  const localPath=page.offlineBundled===true&&typeof page.imagePath==='string'&&page.imagePath.startsWith(BUNDLED_MUSHAF_PREFIX)&&page.imagePath.endsWith('.svg');
  if(!localPath)errors.push('verified-bundled-mushaf-image-required');
  if(typeof page.riwayahAr!=='string'||!page.riwayahAr.includes('حفص'))errors.push('hafs-mushaf-required');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

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
  const mushafValidation=validateMashaalMushafPage(asset.mushafPage);
  if(!mushafValidation.valid)errors.push(...mushafValidation.errors);
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function listVerifiedMashaalRecitationAssets(sourceId){
  return MASHAAL_RECITATION_MEDIA.filter(asset=>(!sourceId||asset.sourceId===sourceId)&&validateMashaalRecitationAsset(asset).valid);
}

export function getMashaalRecitationAsset(assetId){
  const asset=MASHAAL_RECITATION_MEDIA.find(item=>item.id===assetId);
  return asset&&validateMashaalRecitationAsset(asset).valid?asset:null;
}
