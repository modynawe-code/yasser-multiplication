// TV presentation only. Never mutate game state or trust snapshots for permission decisions.
import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { createThreeDice } from './dice3d.mjs';

const limit=(n,min,max)=>Math.min(max,Math.max(min,n));
function rgb(hex){return Number(String(hex||'#18a775').replace('#','0x'))||0x18a775;}
export async function createCinematicScene({board,cells,colors}){
  if(!board||!cells?.size)return null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app=new Application();
  await app.init({resizeTo:board,backgroundAlpha:0,preference:'webgl',antialias:true,resolution:limit(devicePixelRatio||1,1,2),autoDensity:true});
  const canvas=app.canvas;
  canvas.className='tv-cinematic-canvas';
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6';
  board.append(canvas);
  const actors=new Map(), layer=new Container(), light=new Graphics();
  app.stage.addChild(light,layer);
  let destroyed=false;
  const xy=index=>{
    const cell=cells.get(index);
    return cell?{x:cell.offsetLeft+cell.offsetWidth/2,y:cell.offsetTop+cell.offsetHeight/2}:null;
  };
  const makePawn=(name,color)=>{
    const root=new Container();
    const c=rgb(color),body=new Graphics();
    const shadow=new Graphics().ellipse(0,12,14,5).fill({color:0x091b16,alpha:.38});
    body.circle(0,1,12).fill({color:0x14271e,alpha:.7});
    body.circle(0,-2,10).fill(c);
    body.ellipse(-3,-7,4,2).fill({color:0xffffff,alpha:.65});
    body.circle(0,-2,10).stroke({color:0xffffff,width:1.8,alpha:.88});
    root.addChild(shadow,body);
    root.label='Pawn '+name;
    layer.addChild(root);return root;
  };
  function sync(state){
    if(destroyed||!state?.players)return;
    const ids=new Set(state.players.map(p=>p.id));
    for(const [id,actor] of actors){if(!ids.has(id)){gsap.killTweensOf(actor.position);layer.removeChild(actor);actor.destroy({children:true});actors.delete(id);}}
    state.players.forEach((p,i)=>{
      let actor=actors.get(p.id);
      if(!actor){actor=makePawn(p.name,colors[i%colors.length]);actors.set(p.id,actor);}
      const point=xy(p.position||0);
      if(point&&actor.__fresh!==false){actor.position.set(point.x,point.y);actor.__fresh=false;}
      actor.alpha=state.players[state.turnIndex]?.id===p.id?1:.84;
    });
  }
  function refresh(state){
    if(destroyed)return;
    sync(state);
  }
  function focus(index,zoom=1.12){
    if(destroyed)return;
    gsap.killTweensOf(board);
    const point=xy(index);
    if(!point)return;
    const x=point.x/Math.max(1,board.offsetWidth)*100,y=point.y/Math.max(1,board.offsetHeight)*100;
    gsap.set(board,{transformOrigin:x.toFixed(2)+'% '+y.toFixed(2)+'%'});
    gsap.to(board,{scale:reduced()?1:zoom,duration:reduced()?0:.52,ease:'power2.out',overwrite:true});
    light.clear().circle(point.x,point.y,limit(board.offsetWidth*.04,20,45)).fill({color:0xf6d678,alpha:.16});
  }
  function overview(){
    if(destroyed)return;
    gsap.killTweensOf(board);
    gsap.to(board,{scale:1,duration:reduced()?0:.7,ease:'power2.inOut'});
    light.clear();
  }
  async function move(id,index,duration=.24){
    if(destroyed)return;
    const actor=actors.get(id),point=xy(index);
    if(!actor||!point)return;
    gsap.killTweensOf(actor.position);
    if(reduced()){actor.position.set(point.x,point.y);return;}
    await new Promise(resolve=>gsap.to(actor.position,{x:point.x,y:point.y,duration,ease:'power1.inOut',onComplete:resolve,onInterrupt:resolve}));
  }
  // Server-authoritative dice: Pixi draws the exact supplied faces, GSAP animates presentation only.
  const pipLayout={
    1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],
    4:[[-1,-1],[1,-1],[-1,1],[1,1]],
    5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
    6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]
  };
  const diceLayer=new Container();
  app.stage.addChild(diceLayer);
  let diceTimeline=null,threeDice=null,threeUnavailable=false;
  function paintDie(number){
    const side=limit(board.offsetWidth*.092,36,86);
    const g=new Graphics();
    g.roundRect(-side/2+4,-side/2+9,side,side,side*.16).fill({color:0x0a2419,alpha:.32});
    g.roundRect(-side/2,-side/2,side,side,side*.16).fill(0xfff9e9).stroke({color:0xc8a45d,width:side*.035});
    g.roundRect(-side/2+side*.07,-side/2+side*.06,side*.86,side*.12,side*.04).fill({color:0xffffff,alpha:.5});
    for(const [px,py] of pipLayout[number]||[])
      g.circle(px*side*.245,py*side*.245,side*.065).fill(0x183d2b);
    return g;
  }
  function clearDice(){
    threeDice?.clear();
    if(diceTimeline){diceTimeline.kill();diceTimeline=null;}
    const nodes=diceLayer.removeChildren();
    for(const node of nodes)node.destroy({children:true});
  }
  async function rollDice(values){
    if(destroyed||!Array.isArray(values)||values.length!==2||
       !values.every(n=>Number.isInteger(n)&&n>=1&&n<=6))return Promise.resolve(false);
    clearDice();
    if(!threeUnavailable){
      try{
        threeDice||=createThreeDice(board);
        if(await threeDice.roll(values))return true;
      }catch(error){
        console.warn('Three.js dice unavailable; using PixiJS dice fallback',error);
        threeDice?.destroy();threeDice=null;threeUnavailable=true;
      }
    }
    const centerX=board.offsetWidth/2,centerY=board.offsetHeight/2;
    const side=limit(board.offsetWidth*.092,36,86);
    const dice=values.map((face,i)=>{
      const die=paintDie(face);
      die.position.set(centerX+(i===0?-1:1)*side*.68,centerY);
      die.alpha=1;diceLayer.addChild(die);return die;
    });
    if(reduced())return Promise.resolve(true);
    return new Promise(resolve=>{
      const tl=gsap.timeline({
        onComplete:()=>{diceTimeline=null;resolve(true);},
        onInterrupt:()=>{diceTimeline=null;resolve(false);}
      });
      diceTimeline=tl;
      dice.forEach((die,i)=>{
        tl.fromTo(die,{y:centerY-side*.9,rotation:(i?-1:1)*Math.PI*.75,alpha:.5},
          {y:centerY,rotation:0,alpha:1,duration:.63,ease:'bounce.out'},i*.1);
      });
    });
  }
  function resize(state){if(destroyed)return;threeDice?.resize();for(const p of state?.players||[]){const actor=actors.get(p.id),point=xy(p.position||0);if(actor&&point){gsap.killTweensOf(actor.position);actor.position.set(point.x,point.y);}}}
  function destroy(){
    if(destroyed)return;destroyed=true;
    gsap.killTweensOf(board);
    for(const a of actors.values())gsap.killTweensOf(a.position);
    actors.clear();
    clearDice();
    threeDice?.destroy();threeDice=null;
    app.destroy(true,{children:true});
    gsap.set(board,{clearProps:'transform,transformOrigin'});
  }
  return {sync,refresh,focus,overview,move,rollDice,clearDice,resize,destroy,engine:'pixi.js+gsap+three.js'};
}
