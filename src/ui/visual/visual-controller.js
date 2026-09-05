import { setVisualImage, preloadVisualAssets } from './character-assets.js';
import { byId as $ } from '../dom.js';

export function createVisualController(){
  function home(){
    setVisualImage($('homeYasser'),{character:'yasser',state:'welcome'});
    setVisualImage($('homeAssistant'),{character:'assistant',state:'neutral'});
  }

  function session(mode){
    const card=$('questionCard');
    card?.classList.toggle('exam-mode',mode==='exam');
    if(mode!=='exam')setVisualImage($('sessionAssistant'),{character:'assistant',state:'thinking'});
  }

  function result(){
    setVisualImage($('resultYasser'),{character:'yasser',state:'welcome'});
    setVisualImage($('resultAssistant'),{character:'assistant',state:'neutral'});
  }

  function warm(){
    preloadVisualAssets([
      {character:'yasser',state:'welcome'},
      {character:'assistant',state:'neutral'},
      {character:'assistant',state:'thinking'}
    ]);
  }

  return{home,session,result,warm};
}
