import { getScene } from './scene-manifest.js';
import { setVisualImage, setCompositeImage, preloadVisualAssets } from './character-assets.js';

const TARGETS={
  intro:{yasser:'introYasser',assistant:'introAssistant'},
  home:{yasser:'homeYasser',assistant:'homeAssistant'},
  learn:{yasser:'learnYasser',assistant:'learnAssistant'},
  session:{yasser:'sessionYasser',assistant:'sessionAssistant'},
  result:{yasser:'resultYasser',assistant:'resultAssistant',composite:'resultCelebration'}
};

const CONTAINERS={
  intro:'introCharacters',
  home:'homeCharacters',
  learn:'learnVisuals',
  session:'sessionVisuals',
  result:'resultCharacters'
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
      const container=getElement(CONTAINERS[targetName]);
      if(container)container.removeAttribute('data-scene-motion');
    }
  }

  function hideCharacter(target,character){
    const id=TARGETS[target]?.[character];
    const image=id?getElement(id):null;
    if(image)image.hidden=true;
  }

  async function showCharacter(target,character,state,token){
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

  async function showComposite(target,state,token){
    const id=TARGETS[target]?.composite;
    const image=id?getElement(id):null;
    if(!image||!state)return false;

    image.dataset.visualToken=String(token);
    const loaded=await setCompositeImage(image,{state,token});
    if(image.dataset.visualToken!==String(token))return false;

    image.hidden=!loaded;
    return loaded;
  }

  function applyMotion(target,motion,token){
    const container=getElement(CONTAINERS[target]);
    if(!container)return;

    container.removeAttribute('data-scene-motion');
    if(!motion)return;

    requestAnimationFrame(()=>{
      if(token!==renderToken)return;
      container.dataset.sceneMotion=motion;
    });
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
    applyMotion(scene.target,scene.motion,token);

    if(scene.yasser)showCharacter(scene.target,'yasser',scene.yasser,token);
    else hideCharacter(scene.target,'yasser');

    if(scene.assistant)showCharacter(scene.target,'assistant',scene.assistant,token);
    else hideCharacter(scene.target,'assistant');

    hideCharacter(scene.target,'composite');
    if(scene.composite){
      showComposite(scene.target,scene.composite,token).then(loaded=>{
        if(!loaded||token!==renderToken)return;
        hideCharacter(scene.target,'yasser');
        hideCharacter(scene.target,'assistant');
      });
    }

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
      {character:'assistant',state:'celebrate'},
      {group:'composite',state:'celebration'}
    ]);
  }

  function dispose(){clearTimeout(timer);}

  return{render,result,warm,dispose,getCurrent:()=>current};
}
