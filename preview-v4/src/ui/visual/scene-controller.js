import { getScene } from './scene-manifest.js';
import { setVisualImage, preloadVisualAssets } from './character-assets.js';

const TARGETS={
  home:{yasser:'homeYasser',assistant:'homeAssistant'},
  learn:{yasser:'learnYasser',assistant:'learnAssistant'},
  session:{yasser:'sessionYasser',assistant:'sessionAssistant'},
  result:{yasser:'resultYasser',assistant:'resultAssistant'}
};

export function createSceneController({getElement=document.getElementById.bind(document)}={}){
  let timer=null;
  let current='home';
  let renderToken=0;

  function hideAll(){
    for(const target of Object.values(TARGETS)){
      for(const id of Object.values(target)){
        const image=getElement(id);
        if(image)image.hidden=true;
      }
    }
  }

  function showImage(target,character,state,token){
    const id=TARGETS[target]?.[character];
    const image=id?getElement(id):null;
    if(!image||!state)return;
    image.hidden=false;
    image.dataset.visualToken=String(token);
    setVisualImage(image,{character,state,token});
  }

  function render(name){
    const scene=getScene(name);
    current=name;
    clearTimeout(timer);
    renderToken+=1;
    const token=renderToken;
    hideAll();
    if(scene.target){
      showImage(scene.target,'yasser',scene.yasser,token);
      showImage(scene.target,'assistant',scene.assistant,token);
    }
    if(scene.duration&&scene.returnTo){
      timer=setTimeout(()=>render(scene.returnTo),scene.duration);
    }
  }

  function result(score){
    if(score>=90)return render('result-excellent');
    if(score>=75)return render('result-good');
    return render('result-developing');
  }

  function warm(){
    preloadVisualAssets([
      {character:'yasser',state:'welcome'},
      {character:'assistant',state:'idle'},
      {character:'assistant',state:'thinking'}
    ]);
  }

  function dispose(){clearTimeout(timer);}

  return{render,result,warm,dispose,getCurrent:()=>current};
}
