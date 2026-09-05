export const SCENES={
  home:{target:'home',yasser:'welcome',assistant:'idle'},
  learn:{target:'learn',yasser:'thinking',assistant:'thinking'},
  question:{target:'session',yasser:null,assistant:'thinking'},
  exam:{target:'session',yasser:null,assistant:null},
  correct:{target:'session',yasser:'encourage',assistant:'celebrate',duration:650,returnTo:'question'},
  wrong:{target:'session',yasser:'thinking',assistant:'thinking',duration:950,returnTo:'question'},
  'result-developing':{target:'result',yasser:'encourage',assistant:'thinking'},
  'result-good':{target:'result',yasser:'mastered',assistant:'idle'},
  'result-excellent':{target:'result',yasser:'celebrate',assistant:'celebrate'},
  parent:{target:null,yasser:null,assistant:null}
};

export function getScene(name){
  const scene=SCENES[name];
  if(!scene)throw new Error(`Unknown visual scene: ${name}`);
  return scene;
}
