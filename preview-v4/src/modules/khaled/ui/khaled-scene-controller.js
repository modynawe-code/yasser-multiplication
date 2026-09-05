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
  home:'khaledHomeCharacter',
  session:'khaledSessionCharacter',
  result:'khaledResultCharacter'
});

const FALLBACK_IDS=Object.freeze({
  hub:'hubKhaledFallback',
  home:'khaledHomeCharacterFallback',
  session:'khaledSessionCharacterFallback',
  result:'khaledResultCharacterFallback'
});

function byId(id){return document.getElementById(id);}

export function createKhaledSceneController(){
  const cache=new Map();

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
    const src=ASSETS[key];
    const ok=src?await canLoad(src):false;
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
  function home(){return paint('home','welcome');}
  function question(){return paint('session','groupThinking');}
  function feedback(isCorrect){return paint('session',isCorrect?'encourage':'groupThinking',{motion:isCorrect?'nod':'none'});}
  function result(pct){
    if(pct>=90)return paint('result','groupCelebration',{motion:'celebrate'});
    if(pct>=70)return paint('result','mastered',{motion:'nod'});
    return paint('result','encourage');
  }
  function warm(){Object.values(ASSETS).forEach(src=>canLoad(src));}

  return{ASSETS,warm,hub,home,question,feedback,result,paint};
}
