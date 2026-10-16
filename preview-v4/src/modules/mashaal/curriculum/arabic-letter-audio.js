const ROOT='./assets/audio/mashaal/arabic-letters';

export const MASHAAL_ARABIC_LETTER_AUDIO_SOURCE=Object.freeze({
  title:'الدروس الهجائية لتعلم قراءة القرآن الكريم',
  organization:'وزارة الأوقاف والشؤون الإسلامية – دولة قطر',
  lesson:'الدرس الأول: الحروف العربية المفردة',
  reading:'القصر',
  pageUrl:'https://alquran.islam.gov.qa/droos/Dr1.html',
  downloadUrl:'https://alquran.islam.gov.qa/droos/Download.html'
});

const SOURCE_INDEX=Object.freeze({
  alif:1,ba:2,ta:3,tha:4,jim:5,ha:6,kha:7,dal:8,thal:9,ra:10,zay:11,sin:12,shin:13,sad:14,dad:15,taa:16,zaa:17,ain:18,ghain:19,fa:20,qaf:21,kaf:22,lam:23,mim:24,nun:25,haa:26,waw:27,ya:29
});

export const MASHAAL_ARABIC_LETTER_AUDIO=Object.freeze(
  Object.fromEntries(Object.entries(SOURCE_INDEX).map(([id,sourceIndex])=>[
    id,
    Object.freeze({
      id,
      sourceIndex,
      url:`${ROOT}/${id}.mp3`,
      source:'qatar-awqaf-dr1-qasr'
    })
  ]))
);

export function getMashaalArabicLetterAudio(letterId){
  return MASHAAL_ARABIC_LETTER_AUDIO[String(letterId||'')]||null;
}

export function listMashaalArabicLetterAudioAssets(){
  return Object.values(MASHAAL_ARABIC_LETTER_AUDIO).map(item=>item.url);
}

export function createMashaalArabicLetterAudioPlayer({AudioCtor=globalThis.Audio}={}){
  let audio=null;
  function stop(){
    if(!audio)return;
    try{audio.pause();audio.currentTime=0;}catch{}
    audio=null;
  }
  async function play(letterId){
    const item=getMashaalArabicLetterAudio(letterId);
    if(!item||typeof AudioCtor!=='function')return false;
    stop();
    audio=new AudioCtor(item.url);
    try{
      audio.preload='auto';
      audio.playsInline=true;
      audio.currentTime=0;
      await audio.play();
      return true;
    }catch{
      return false;
    }
  }
  return Object.freeze({play,stop,get current(){return audio;}});
}
