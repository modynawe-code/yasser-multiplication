export const SCENES={
  intro:{target:'intro',yasser:'encourage',assistant:'idle'},
  home:{target:'home',yasser:'encourage',assistant:'idle'},
  learn:{target:'learn',yasser:'thinking',assistant:'thinking'},
  question:{target:'session',yasser:'thinking',assistant:'thinking'},
  exam:{target:'session',yasser:null,assistant:null},
  correct:{target:'session',yasser:'celebrate',assistant:'celebrate',duration:1700,returnTo:'question'},
  wrong:{target:'session',yasser:'encourage',assistant:'thinking',duration:2400,returnTo:'question'},
  'result-developing':{target:'result',yasser:'encourage',assistant:'thinking',motion:'round-complete'},
  'result-good':{target:'result',yasser:'mastered',assistant:'idle',motion:'round-complete'},
  'result-excellent':{target:'result',yasser:'celebrate',assistant:'celebrate',composite:'celebration',motion:'celebrate'},
  parent:{target:null,yasser:null,assistant:null}
};

export function getScene(name){
  const scene=SCENES[name];
  if(!scene)throw new Error(`Unknown visual scene: ${name}`);
  return scene;
}
