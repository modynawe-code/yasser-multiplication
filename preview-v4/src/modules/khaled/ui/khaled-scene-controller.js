const ASSETS=Object.freeze({
  welcome:'assets/visual/original/khaled/khaled-point-thumbsup.png',
  mastered:'assets/visual/original/khaled/khaled-star-badge.png',
  thinking:'assets/visual/original/khaled/khaled-thinking.png',
  celebrate:'assets/visual/original/khaled/khaled-celebration.png',
  encourage:'assets/visual/original/khaled/khaled-thumbsup.png',
  groupThinking:'assets/visual/original/khaled/group/khaled-thinking-with-calculator.png',
  groupCelebration:'assets/visual/original/khaled/group/khaled-celebration-with-calculator.png'
});

const SLOT_IDS=Object.freeze({
  hub:'hubKhaledCharacter',
  intro:'khaledIntroCharacter',
  home:'khaledHomeCharacter',
  session:'khaledSessionCharacter',
  result:'khaledResultCharacter'
});

const FALLBACK_IDS=Object.freeze({
  hub:'hubKhaledFallback',
  intro:'khaledIntroCharacterFallback',
  home:'khaledHomeCharacterFallback',
  session:'khaledSessionCharacterFallback',
  result:'khaledResultCharacterFallback'
});

const WARM_ASSET_KEYS=Object.freeze(['welcome','groupThinking']);

function byId(id){return document.getElementById(id);}

export function createKhaledSceneController(){
  const cache=new Map();
  const paintEpoch=new Map();

  function canLoad(src){
    if(cache.has(src))return cache.get(src);
    const promise=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>resolve(true);
      image.onerror=()=>resolve(false);
      image.src=src;
    });
    cache.set(src,promise);
    return promise;
  }

  async function paint(slot,key,{motion='none'}={}){
    const image=byId(SLOT_IDS[slot]);
    const fallback=byId(FALLBACK_IDS[slot]);
    if(!image)return false;
    const epoch=(paintEpoch.get(slot)||0)+1;
    paintEpoch.set(slot,epoch);
    const src=ASSETS[key];
    const ok=src?await canLoad(src):false;
    // A slower previous image request must never overwrite a newer scene state.
    if(paintEpoch.get(slot)!==epoch)return false;
    if(ok){
      image.src=src;
      image.hidden=false;
      image.dataset.khaledState=key;
      image.dataset.motion=motion;
      fallback?.setAttribute('hidden','');
      return true;
    }
    image.hidden=true;
    image.removeAttribute('src');
    image.dataset.khaledState=key||'fallback';
    if(fallback){
      fallback.hidden=false;
      fallback.dataset.khaledState=key||'fallback';
    }
    return false;
  }

  function hub(){return paint('hub','welcome');}
  function intro(){return paint('intro','groupThinking');}
  // Home uses the standalone thinking pose so the skill chooser has its own visual identity.
  function home(){return paint('home','thinking');}
  function question(){return paint('session','groupThinking');}
  // Feedback changes the artwork inside the same 4:3 session stage. This keeps the
  // child and calculator full-size and prevents portrait artwork from collapsing/cropping the scene.
  function feedback(isCorrect){return paint('session',isCorrect?'groupCelebration':'groupThinking',{motion:isCorrect?'nod':'none'});}
  function result(pct){
    // A perfect round earns Khaled's standalone celebration pose; strong ordinary rounds
    // keep the shared Khaled + calculator celebration. Lower bands retain their own states.
    if(pct===100)return paint('result','celebrate',{motion:'celebrate'});
    if(pct>=80)return paint('result','groupCelebration',{motion:'celebrate'});
    if(pct>=60)return paint('result','mastered',{motion:'nod'});
    return paint('result','encourage');
  }

  // Preserve original PNG quality without forcing ~9MB of artwork into the initial route.
  // Only the immediately likely states are warmed; all other states load on first use and
  // are then handled by the service worker's normal runtime cache.
  function warm(){WARM_ASSET_KEYS.forEach(key=>canLoad(ASSETS[key]));}

  return{ASSETS,WARM_ASSET_KEYS,warm,hub,intro,home,question,feedback,result,paint};
}
