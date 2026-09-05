import { VISUAL_ASSETS, getScene } from './scene-manifest.js';

const ROOT=new URL('../../../',import.meta.url);

function assetUrl(character,state){
  const path=VISUAL_ASSETS[character]?.[state];
  return path?new URL(path,ROOT).href:'';
}

export function createSceneController({getElement=document.getElementById.bind(document)}={}){
  let timer=null;
  let current='home';

  function render(name){
    const scene=getScene(name);
    current=name;
    clearTimeout(timer);
    const yasser=getElement('sceneYasser');
    const assistant=getElement('sceneAssistant');
    if(yasser){
      yasser.hidden=!scene.yasser;
      if(scene.yasser){yasser.src=assetUrl('yasser',scene.yasser);yasser.dataset.state=scene.yasser;}
    }
    if(assistant){
      assistant.hidden=!scene.assistant;
      if(scene.assistant){assistant.src=assetUrl('assistant',scene.assistant);assistant.dataset.state=scene.assistant;}
    }
    if(scene.duration&&scene.returnTo){
      timer=setTimeout(()=>render(scene.returnTo),scene.duration);
    }
  }

  function result(score){render(score>=90?'result-excellent':'result-good');}
  function dispose(){clearTimeout(timer);}

  return{render,result,dispose,getCurrent:()=>current};
}
