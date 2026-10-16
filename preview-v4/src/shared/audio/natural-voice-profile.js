export const NATURAL_VOICE_PROFILE=Object.freeze({
  locale:'ar-SA',
  gulfFallbackLocales:Object.freeze(['ar-AE','ar-KW','ar-QA','ar-BH','ar-OM']),
  rate:.96,
  pitch:.98,
  volume:1,
  browserVoiceWaitMs:350
});

const NATURAL_NAME=/natural|neural|generative|wavenet|premium|enhanced|\bhd\b|online|cloud/i;
const LEGACY_NAME=/legacy|compact|espeak|basic|offline/i;

function normalizeLocale(value){return String(value||'').trim().replace('_','-').toLowerCase();}

export function scoreArabicVoice(voice,lang=NATURAL_VOICE_PROFILE.locale){
  if(!voice)return Number.NEGATIVE_INFINITY;
  const candidate=normalizeLocale(voice.lang),wanted=normalizeLocale(lang),name=String(voice.name||'');
  const gulf=NATURAL_VOICE_PROFILE.gulfFallbackLocales.map(normalizeLocale);
  let score=0;

  if(candidate===wanted)score+=130;
  else if(gulf.includes(candidate))score+=95;
  else if(candidate.startsWith('ar-'))score+=65;
  else if(candidate==='ar')score+=55;
  else return Number.NEGATIVE_INFINITY;

  if(NATURAL_NAME.test(name))score+=90;
  if(LEGACY_NAME.test(name))score-=30;
  if(/google|microsoft|samsung/i.test(name))score+=6;
  if(voice.localService===false)score+=8;
  else if(voice.localService===true)score+=2;
  if(voice.default)score+=1;
  return score;
}
