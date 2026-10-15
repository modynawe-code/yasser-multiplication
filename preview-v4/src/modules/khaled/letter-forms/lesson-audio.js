import { createFeedbackAudio } from '../../../ui/audio/feedback-audio.js';
import { humanVoiceAssetPath } from '../../../shared/audio/human-voice-assets.js';
import { LETTER_VIDEO_AUDIO_BY_ID,LETTER_VIDEO_AUDIO_ROOT } from './letter-video-audio-manifest.js';

const LETTER_AUDIO_ROOT='./assets/audio/mashaal/arabic-letters/';

export const LETTER_FORM_NARRATION=Object.freeze({
  forms:Object.freeze({id:'khaled.letter-forms.explain.forms',text:'شاهد أشكال الحرف، وانتبه إلى طريقة اتصاله.'}),
  connections:Object.freeze({id:'khaled.letter-forms.explain.connections',text:'لاحظ الحرف الذي قبل حرفنا والحرف الذي بعده.'}),
  question:Object.freeze({id:'khaled.letter-forms.explain.question',text:'اختر شكل الحرف المناسب في هذه الكلمة.'}),
  writing:Object.freeze({id:'khaled.letter-forms.explain.writing',text:'ابدأ من النقطة، واتبع مسار كتابة الحرف.'}),
  correct:Object.freeze({id:'khaled.letter-forms.feedback.correct',text:'أحسنت يا خالد، إجابتك صحيحة!'}),
  retry:Object.freeze({id:'khaled.letter-forms.feedback.retry',text:'حاول مرة ثانية. انتبه للحروف المتصلة به.'}),
  complete:Object.freeze({id:'khaled.letter-forms.feedback.complete',text:'رائع يا خالد، أكملت أشكال الحرف!'})
});

export function createLetterLessonAudio({AudioClass=globalThis.Audio,effects=createFeedbackAudio()}={}){
  let current=null,currentFinish=null,generation=0;

  function halt(){
    if(!current)return;
    const audio=current,finish=currentFinish;
    current=null;
    currentFinish=null;
    try{audio.pause();audio.currentTime=0;}catch{}
    finish?.(false);
  }

  function stop(){
    generation++;
    halt();
  }

  async function playFile(src,{interrupt=true}={}){
    if(typeof AudioClass!=='function'||typeof src!=='string')return false;
    if(interrupt)generation++;
    halt();
    let audio;
    try{audio=new AudioClass(src);}catch{return false;}
    current=audio;
    audio.preload='auto';audio.playsInline=true;
    return await new Promise(resolve=>{
      let settled=false;
      const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(current===audio)current=null;if(currentFinish===finish)currentFinish=null;resolve(ok);};
      currentFinish=finish;
      const timer=setTimeout(()=>finish(false),12000);
      audio.addEventListener?.('ended',()=>finish(true),{once:true});
      audio.addEventListener?.('error',()=>finish(false),{once:true});
      try{Promise.resolve(audio.play()).catch(()=>finish(false));}catch{finish(false);}
    });
  }

  async function playLetter(letterId){
    if(!/^[a-z]+$/.test(String(letterId||'')))return false;
    return playFile(`${LETTER_AUDIO_ROOT}${letterId}.mp3`);
  }

  async function playLetterExplanation(letterId){
    if(!/^[a-z]+$/.test(String(letterId||''))||!LETTER_VIDEO_AUDIO_BY_ID[letterId])return false;
    return playFile(`${LETTER_VIDEO_AUDIO_ROOT}${letterId}.mp3`);
  }

  async function playNarration(lineId){
    const line=LETTER_FORM_NARRATION[lineId];
    return line?playFile(`./${humanVoiceAssetPath(line.text)}`):false;
  }

  function playFeedback(kind){
    stop();
    return playEffect(kind);
  }

  function playEffect(kind){
    if(kind==='correct')return effects.correct();
    if(kind==='wrong')return effects.wrong();
    if(kind==='achievement')return effects.achievement();
    return false;
  }

  async function respond(kind,lineId){
    const token=++generation,line=LETTER_FORM_NARRATION[lineId];
    halt();playEffect(kind);
    const spoken=line?await playFile(`./${humanVoiceAssetPath(line.text)}`,{interrupt:false}):false;
    return token===generation&&spoken;
  }

  return Object.freeze({playLetter,playLetterExplanation,playNarration,playFeedback,respond,stop});
}
