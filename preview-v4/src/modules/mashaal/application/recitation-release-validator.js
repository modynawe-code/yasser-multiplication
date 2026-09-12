import { getMashaalRecitationAsset } from '../curriculum/recitation-media-manifest.js';
import { getMashaalRecitationSource } from '../curriculum/recitation-source-registry.js';

export function validateMashaalRecitationActivity(activity){
  const errors=[];
  if(!activity||activity.skillId!=='listen-repeat')return Object.freeze({valid:false,errors:Object.freeze(['recitation-activity-required'])});
  const mediaAsset=getMashaalRecitationAsset(activity.mediaAssetId),mediaSource=getMashaalRecitationSource(activity.mediaSourceId);
  if(!mediaAsset)errors.push('approved-recitation-media-required');
  if(!mediaSource||mediaSource.sourceApproved!==true||mediaSource.humanVoice!==true)errors.push('approved-recitation-source-required');
  if(activity.syntheticRecitationAllowed!==false)errors.push('synthetic-recitation-not-allowed');
  if(mediaAsset&&activity.mediaSourceId!==mediaAsset.sourceId)errors.push('recitation-media-source-mismatch');
  if(mediaAsset&&activity.mediaPath!==mediaAsset.localPath)errors.push('recitation-media-path-mismatch');
  if(mediaAsset&&activity.mediaSha256!==mediaAsset.sha256)errors.push('recitation-media-integrity-mismatch');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function listValidatedMashaalRecitationActivities(activities=[]){
  return activities.filter(activity=>validateMashaalRecitationActivity(activity).valid);
}
