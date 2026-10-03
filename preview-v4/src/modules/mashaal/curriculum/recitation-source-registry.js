import { listVerifiedMashaalRecitationAssets } from './recitation-media-manifest.js';

const KFGQPC_AUDIO_RIGHTS_URL='https://qc-dev.qurancomplex.gov.sa/quran-audios/';

export const MASHAAL_RECITATION_TARGET=Object.freeze({
  surahNumber:112,
  surahNameAr:'الإخلاص',
  scope:'single-surah'
});

export const MASHAAL_RECITATION_SOURCES=Object.freeze({
  'kfgqpc-ibrahim-al-akhdar-hafs':Object.freeze({
    id:'kfgqpc-ibrahim-al-akhdar-hafs',
    authority:'King Fahd Glorious Quran Printing Complex',
    authorityAr:'مجمع الملك فهد لطباعة المصحف الشريف',
    reciter:'Ibrahim Al-Akhdar',
    reciterAr:'إبراهيم الأخضر',
    riwayah:'Hafs from Asim',
    riwayahAr:'حفص عن عاصم',
    humanVoice:true,
    sourceApproved:true,
    rightsStatus:'explicit-public-use-for-applications',
    rightsUrl:KFGQPC_AUDIO_RIGHTS_URL,
    sourcePage:'https://qurancomplex.gov.sa/en/sounds-hafs-akhdar/',
    sourcePackage:'https://download.qurancomplex.gov.sa/new-sounds/akhdar/hafs/akhdar-sura.zip',
    targetSurah:MASHAAL_RECITATION_TARGET,
    childLearningMode:Object.freeze(['listen','repeat','replay']),
    syntheticRecitationAllowed:false
  })
});

export const MASHAAL_DEFAULT_RECITATION_SOURCE_ID='kfgqpc-ibrahim-al-akhdar-hafs';

export function getMashaalRecitationSource(id=MASHAAL_DEFAULT_RECITATION_SOURCE_ID){
  return MASHAAL_RECITATION_SOURCES[id]||null;
}

export function getMashaalRecitationMediaStatus(id=MASHAAL_DEFAULT_RECITATION_SOURCE_ID){
  const source=getMashaalRecitationSource(id);
  const localAssets=source?listVerifiedMashaalRecitationAssets(source.id).filter(asset=>asset.surahNumber===MASHAAL_RECITATION_TARGET.surahNumber):[];
  return Object.freeze({
    sourceId:source?.id||null,
    targetSurah:MASHAAL_RECITATION_TARGET,
    sourceApproved:Boolean(source?.sourceApproved&&source?.humanVoice&&source?.rightsStatus==='explicit-public-use-for-applications'),
    localMediaReady:localAssets.length===1,
    localAssets:Object.freeze([...localAssets]),
    syntheticRecitationAllowed:Boolean(source?.syntheticRecitationAllowed)
  });
}
