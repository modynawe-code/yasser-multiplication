import { getScene } from './scene-manifest.js';
import { setVisualImage, preloadVisualAssets } from './character-assets.js';

const TARGETS={
  intro:{yasser:'introYasser',assistant:'introAssistant'},
  home:{yasser:'homeYasser',assistant:'homeAssistant'},
  learn:{yasser:'learnYasser',assistant:'learnAssistant'},
  session:{yasser:'sessionYasser',assistant:'sessionAssistant'},
  result:{yasser:'resultYasser',assistant:'resultAssistant'}
};

export function createSceneController({getElement=document.getElementById.bind(document)}={}){
  let timer=null;
  let current='intro';
  let renderToken=0;

  function hideOtherTargets(activeTarget){
    for(const [targetName,target] of Object.entries(TARGETS)){
      if(targetName===activeTarget)continue;
      for(const id of Object.values(target)){
        const image=getElement(id);
        if(image)image.hidden=true;
      }
    }
  }

  function hideCharacter(target,character){
    const id=TARGETS[target]?.[character];
    const image=id?getElement(id):null;
    if(image)image.hidden=true;
  }

  async function showImage(target,character,state,token){
    const id=TARGETS[target]?.[character];
    const image=id?getElement(id):null;
    if(!image||!state)return false;

    image.dataset.visualToken=String(token);
    const hadVisibleSource=!image.hidden&&Boolean(image.getAttribute('src'));
    const loaded=await setVisualImage(image,{character,state,token});

    if(image.dataset.visualToken!==String(token))return false;

    if(loaded||hadVisibleSource||image.getAttribute('src')){
      image.hidden=false;
      return true;
    }

    image.hidden=true;
    return false;
  }

  function render(name){
    const scene=getScene(name);
    current=name;
    clearTimeout(timer);
    renderToken+=1;
    const token=renderToken;

    if(!scene.target){
      hideOtherTargets(null);
      return 0;
    }

    hideOtherTargets(scene.target);

    if(scene.yasser)showImage(scene.target,'yasser',scene.yasser,token);
    else hideCharacter(scene.target,'yasser');

    if(scene.assistant)showImage(scene.target,'assistant',scene.assistant,token);
    else hideCharacter(scene.target,'assistant');

    if(scene.duration&&scene.returnTo){
      timer=setTimeout(()=>render(scene.returnTo),scene.duration);
    }

    return scene.duration||0;
  }

  function result(score){
    if(score>=90)return render('result-excellent');
    if(score>=75)return render('result-good');
    return render('result-developing');
  }

  function warm(){
    preloadVisualAssets([
      {character:'yasser',state:'encourage'},
      {character:'yasser',state:'thinking'},
      {character:'yasser',state:'celebrate'},
      {character:'yasser',state:'mastered'},
      {character:'assistant',state:'idle'},
      {character:'assistant',state:'thinking'},
      {character:'assistant',state:'celebrate'}
    ]);
  }

  function dispose(){clearTimeout(timer);}

  return{render,result,warm,dispose,getCurrent:()=>current};
}
