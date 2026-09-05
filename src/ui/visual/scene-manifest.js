export const VISUAL_ASSETS={
  yasser:{
    welcome:'assets/characters/yasser-welcome.webp',
    thinking:'assets/characters/yasser-thinking.webp',
    encourage:'assets/characters/yasser-encourage.webp',
    celebrate:'assets/characters/yasser-celebrate.webp',
    mastered:'assets/characters/yasser-mastered.webp'
  },
  assistant:{
    idle:'assets/assistant/assistant-idle.webp',
    thinking:'assets/assistant/assistant-thinking.webp',
    celebrate:'assets/assistant/assistant-celebrate.webp'
  }
};

export const SCENES={
  home:{yasser:'welcome',assistant:'idle'},
  learn:{yasser:'thinking',assistant:'thinking'},
  question:{yasser:null,assistant:'thinking'},
  correct:{yasser:'encourage',assistant:'celebrate',duration:850,returnTo:'question'},
  wrong:{yasser:'thinking',assistant:'thinking',duration:1200,returnTo:'question'},
  'result-good':{yasser:'mastered',assistant:'idle'},
  'result-excellent':{yasser:'celebrate',assistant:'celebrate'},
  parent:{yasser:null,assistant:null}
};

export function getScene(name){
  const scene=SCENES[name];
  if(!scene)throw new Error(`Unknown visual scene: ${name}`);
  return scene;
}
