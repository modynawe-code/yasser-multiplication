import { listVerifiedMashaalRecitationAssets } from '../curriculum/recitation-media-manifest.js';
import { MASHAAL_DEFAULT_RECITATION_SOURCE_ID,MASHAAL_RECITATION_TARGET } from '../curriculum/recitation-source-registry.js';

const SELS='saudi-early-learning-standards-3-6-2015';
const RECITATION_SKILL_ID='listen-repeat';

export function createMashaalRecitationActivities(skillId){
  if(skillId!==RECITATION_SKILL_ID)return Object.freeze([]);
  const assets=listVerifiedMashaalRecitationAssets(MASHAAL_DEFAULT_RECITATION_SOURCE_ID)
    .filter(asset=>asset.surahNumber===MASHAAL_RECITATION_TARGET.surahNumber)
    .slice(0,1);
  return Object.freeze(assets.map(asset=>Object.freeze({
    id:`kg3-recitation-${asset.id}`,
    stage:'kg3',
    sourceId:SELS,
    status:'verified',
    evidenceType:'activity-completion',
    childFacingScore:false,
    skillId:RECITATION_SKILL_ID,
    indicatorRefs:Object.freeze(['IE 1.0.2','IE 1.0.3']),
    interaction:'listening',
    promptAr:`اسمعي سورة ${asset.surahNameAr} ثم رددي بهدوء.`,
    audioPromptAr:`اضغطي تشغيل، اسمعي سورة ${asset.surahNameAr}، ثم رددي بعد القارئ.`,
    stimulus:Object.freeze({kind:'recitation-audio',surahNameAr:asset.surahNameAr,surahNumber:asset.surahNumber}),
    choices:Object.freeze(['done']),
    mediaSourceId:asset.sourceId,
    mediaAssetId:asset.id,
    mediaPath:asset.localPath,
    mediaSha256:asset.sha256,
    mushafPage:asset.mushafPage?Object.freeze({...asset.mushafPage}):null,
    syntheticRecitationAllowed:false
  })));
}
