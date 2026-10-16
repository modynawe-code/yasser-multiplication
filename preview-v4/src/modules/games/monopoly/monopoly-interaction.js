import {eventArea,boardEdge} from './monopoly-scene.js';
import { dicePips } from './monopoly-presentation.js';

// Each orientation brings the matching cube face toward the player.
export const DICE_ORIENTATIONS=Object.freeze({1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]});
export function diceCubeMarkup(value=1){
  const [x,y]=DICE_ORIENTATIONS[value]||DICE_ORIENTATIONS[1];
  return `<span class="mono-cube" style="transform:rotateX(-12deg) rotateY(14deg) rotateX(${x}deg) rotateY(${y}deg)">${[1,6,3,4,2,5].map((face,i)=>`<span class="mono-cube-face mono-cube-face-${i}">${dicePips(face)}</span>`).join('')}</span>`;
}
export function cameraTransform(width,height,target,scale,anchor={x:.5,y:.5}){
  const z=Math.max(1,Math.min(2.8,scale));
  const tx=Math.max(width*(1-z),Math.min(0,width*anchor.x-target.x*z));
  const ty=Math.max(height*(1-z),Math.min(0,height*anchor.y-target.y*z));
  return {scale:z,x:tx,y:ty};
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createMonopolyInteraction({getElement=id=>document.getElementById(id),isMuted=()=>false,onRoll=()=>{},canRoll=()=>false}={}){
  let diceBuffers=null,diceDecode=null,diceSoundIndex=0,zoomFrame=0,manualCamera=false,cameraAnimation=null;const recordingBytes=Promise.all([1,2,3].map(n=>fetch(new URL(`./assets/audio/dice-roll-${n}.mp3`,import.meta.url)).then(r=>{if(!r.ok)throw new Error('Dice audio unavailable');return r.arrayBuffer();}))).catch(()=>[]);
  let audio=null,epoch=0,scale=1,pan={x:0,y:0},installed=false,lastTap=0,suppressClickUntil=0;
  const cardEffects=new Set();
  const effects=new Set(),voices=new Set(),pointers=new Map();
  const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const board=()=>getElement('monoBoard'),wrap=()=>getElement('monoBoardWrap');
  function animate(node,frames,options){if(!node||reduced())return Promise.resolve();const a=node.animate?.(frames,options);if(!a)return Promise.resolve();effects.add(a);return a.finished.catch(()=>{}).finally(()=>effects.delete(a));}
  function unlockAudio(){if(isMuted())return;try{const Ctor=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Ctor)return;audio??=new Ctor();if(audio.state==='suspended')void audio.resume();}catch{}}
  async function prepareDiceAudio(){if(!audio||diceBuffers)return;if(!diceDecode)diceDecode=recordingBytes.then(bytes=>Promise.all(bytes.map(data=>audio.decodeAudioData(data.slice(0))))).then(buffers=>{diceBuffers=buffers;}).catch(()=>{diceBuffers=[];});await diceDecode;}
  function sound(kind){
    if(isMuted()||!audio||audio.state!=='running')return;
    const at=audio.currentTime;
    if(kind==='roll'){const buffer=diceBuffers?.[diceSoundIndex++%diceBuffers.length];if(!buffer)return;const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;source.playbackRate.value=buffer.duration/1.05;gain.gain.value=.75;source.connect(gain);gain.connect(audio.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(at);return;}
    function tone(freq,offset,duration,gainValue=.06,type='sine'){
      const source=audio.createOscillator(),gain=audio.createGain();source.type=type;source.frequency.setValueAtTime(freq,at+offset);source.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.7),at+offset+duration);gain.gain.setValueAtTime(.001,at+offset);gain.gain.exponentialRampToValueAtTime(gainValue,at+offset+.008);gain.gain.exponentialRampToValueAtTime(.001,at+offset+duration);source.connect(gain);gain.connect(audio.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(at+offset);source.stop(at+offset+duration+.02);
    }
    function noise(offset,duration,volume){const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=kind==='draw'?1800:4200;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at+offset);}
    if(kind==='draw'||kind==='flip'){noise(0,.19,.1);tone(420,.12,.08,.025,'triangle');}
    else if(kind==='step')tone(180,0,.05,.025,'triangle');
    else if(kind==='payment'||kind==='confirm'){[1050,820,620].forEach((f,i)=>tone(f,i*.075,.12,.04,'triangle'));}
    else if(kind==='reward'||kind==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,i*.11,.22,.045));}
    else if(kind==='bankrupt'){[330,247,165].forEach((f,i)=>tone(f,i*.16,.22,.045));}
    else if(kind==='build'){noise(0,.08,.09);tone(700,.12,.16,.04,'triangle');}
    else if(kind==='turn'){tone(440,0,.11,.04);tone(660,.12,.15,.04);}
  }
  function syncZoom(instant=false){
    cancelAnimationFrame(zoomFrame);const b=board(),w=wrap();if(!b||!w)return;
    if(instant){w.style.setProperty('--mono-zoom',scale);return;}
    const ticket=epoch,animation=cameraAnimation;
    const tick=()=>{if(ticket!==epoch||animation!==cameraAnimation)return;const matrix=getComputedStyle(b).transform,match=matrix.match(/^matrix\(([^,]+)/);w.style.setProperty('--mono-zoom',match?Number(match[1]):scale);if(animation?.playState==='running')zoomFrame=requestAnimationFrame(tick);};tick();
  }
  function camera(target=null,z=1,instant=false,anchor){
    const b=board();if(!b)return Promise.resolve();
    const before=getComputedStyle(b).transform;
    cameraAnimation?.cancel();
    const t=cameraTransform(b.offsetWidth,b.offsetHeight,target||{x:b.offsetWidth/2,y:b.offsetHeight/2},z,anchor);
    scale=t.scale;pan={x:t.x,y:t.y};b.style.transformOrigin='0 0';b.style.transition='none';
    const after=`translate(${pan.x}px,${pan.y}px) scale(${scale})`;b.style.transform=after;
    const values=before.match(/^matrix\((.+)\)$/)?.[1].split(',').map(Number);
    const settled=values&&Math.abs(values[0]-scale)<.0001&&Math.abs(values[4]-pan.x)<.01&&Math.abs(values[5]-pan.y)<.01;
    if(instant||reduced()||settled||!b.animate){cameraAnimation=null;syncZoom(true);return Promise.resolve();}
    const animation=b.animate([{transform:before==='none'?'translate(0px,0px) scale(1)':before},{transform:after}],{duration:550,easing:'cubic-bezier(.22,.7,.2,1)'});
    cameraAnimation=animation;effects.add(animation);syncZoom();
    return animation.finished.catch(()=>{}).finally(()=>{effects.delete(animation);if(cameraAnimation===animation){cameraAnimation=null;cancelAnimationFrame(zoomFrame);wrap()?.style.setProperty('--mono-zoom',scale);}});
  }
  function focus(index,z=1.3){const b=board(),tile=b?.querySelector(`[data-index="${index}"]`);if(!tile)return;const target={x:tile.offsetLeft+tile.offsetWidth/2,y:tile.offsetTop+tile.offsetHeight/2};const edge=value=>value<.25?.12:value>.75?.88:.5;camera(target,z,false,{x:edge(target.x/b.offsetWidth),y:edge(target.y/b.offsetHeight)});}
  function overview(){manualCamera=false;camera();}
  async function followSegment(indexes){if(manualCamera)return;const b=board();if(!b)return;const tiles=indexes.map(i=>b.querySelector(`[data-index="${i}"]`)).filter(Boolean);if(!tiles.length)return;const points=tiles.map(tile=>({x:tile.offsetLeft+tile.offsetWidth/2,y:tile.offsetTop+tile.offsetHeight/2}));const target={x:(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2,y:(Math.min(...points.map(p=>p.y))+Math.max(...points.map(p=>p.y)))/2};await camera(target,1.35);}
  function progress(text,name,color){const w=wrap();if(!w)return;let node=getElement('monoTurnProgress');if(!node){node=document.createElement('p');node.id='monoTurnProgress';node.className='mono-turn-progress';node.setAttribute('role','status');node.setAttribute('aria-live','polite');w.appendChild(node);}node.textContent=text;node.style.setProperty('--player-color',color||'#244634');node.dataset.playerName=name||'';}
  function eventScene(index){const b=board(),w=wrap(),overlay=getElement('monoOverlay');if(!b||!w||!overlay||overlay.hidden)return;const edge=boardEdge(Number(index)),area=eventArea(w.clientWidth,w.clientHeight,edge);overlay.style.left=area.x+'px';overlay.style.right='auto';overlay.style.top=area.y+'px';overlay.style.width=area.width+'px';overlay.style.maxHeight=area.height+'px';overlay.style.transform='none';overlay.dataset.landingEdge=edge;manualCamera=false;focus(index,1.25);}
  async function roll(values){
    const ticket=epoch;const dice=[...getElement('monoDice')?.querySelectorAll('.mono-die')||[]];
    await prepareDiceAudio();if(ticket!==epoch)return;sound('roll');
    await Promise.all(dice.map(async(die,i)=>{const value=values?.[i]||1,[x,y]=DICE_ORIENTATIONS[value];let cube=die.querySelector('.mono-cube');if(!cube){die.innerHTML=diceCubeMarkup(value);cube=die.querySelector('.mono-cube');}die.disabled=true;
      await Promise.all([animate(cube,[{transform:'rotateX(0deg) rotateY(0deg) rotateZ(0deg)'},{transform:`rotateX(${360+x/2}deg) rotateY(${540+y/2}deg) rotateZ(${i?40:-35}deg)`,offset:.6},{transform:`rotateX(-12deg) rotateY(14deg) rotateX(${720+x}deg) rotateY(${720+y}deg) rotateZ(0deg)`}],{duration:1050+i*30,easing:'cubic-bezier(.18,.6,.3,1)',fill:'forwards'}),animate(die,[{transform:'translateY(0)'},{transform:'translateY(-22px) rotate(-8deg)',offset:.25},{transform:'translateY(0)',offset:.55},{transform:'translateY(-8px)',offset:.7},{transform:'translateY(0)'}],{duration:1050+i*30})]);
      if(ticket===epoch){die.innerHTML=diceCubeMarkup(value);die.setAttribute('aria-label',`نتيجة النرد ${value}`);}
    }));
    if(ticket===epoch)await wait(reduced()?0:180);
  }
  function announce(text,kind='turn'){
    getElement('monoAnnouncement')?.remove();const w=wrap();if(!w)return;const message=document.createElement('div');message.id='monoAnnouncement';message.className=`mono-announcement mono-announcement--${kind}`;message.setAttribute('role','status');message.textContent=text;w.appendChild(message);sound(kind);const ticket=epoch;void animate(message,[{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{duration:240});setTimeout(()=>{if(ticket===epoch)message.remove();},kind==='win'?4200:1900);
  }
  function ownership(index,color,building=false){const tile=board()?.querySelector(`[data-index="${index}"]`);if(!tile)return;tile.style.setProperty('--event-color',color||'#258d58');void animate(tile,[{boxShadow:'inset 0 0 0 0px var(--event-color)'},{boxShadow:'inset 0 0 0 5px var(--event-color)'},{boxShadow:'inset 0 0 0 2px var(--event-color)'}],{duration:950});const art=tile.querySelector('.mono-board-buildings');if(building&&art)void animate(art,[{transform:'translateY(-18px) scale(.7)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.9,.3,1.2)'});sound(building?'build':'confirm');}
  async function money(previous,next){
    const changes=next.players.map(p=>({player:p,before:previous.players.find(old=>old.id===p.id)?.cash??p.cash})).filter(row=>row.before!==row.player.cash);
    if(!changes.length)return;const ticket=epoch;const nodes=changes.map(row=>{const seat=document.querySelector(`#monoGame .mono-player-seat[data-player-id="${CSS.escape(row.player.id)}"]`);const cash=seat?.querySelector('.mono-player-seat-cash');const delta=row.player.cash-row.before;if(cash)cash.textContent='الرصيد '+new Intl.NumberFormat('ar-SA').format(row.before);const bubble=document.createElement('span');bubble.className='mono-money-flight '+(delta<0?'is-payment':'is-reward');bubble.textContent=(delta>0?'+':'−')+new Intl.NumberFormat('ar-SA').format(Math.abs(delta));seat?.appendChild(bubble);return{...row,cash,bubble};});
    sound(changes.some(row=>row.player.cash<row.before)?'payment':'reward');
    const source=changes.find(row=>row.player.cash<row.before),recipient=changes.find(row=>row.player.cash>row.before);
    const game=getElement('monoGame'),bounds=game?.getBoundingClientRect(),bank=wrap()?.getBoundingClientRect();
    if(game&&bounds&&bank){
      const locate=row=>row&&document.querySelector(`#monoGame .mono-player-seat[data-player-id="${CSS.escape(row.player.id)}"]`)?.getBoundingClientRect();
      const origin=locate(source)||bank,destination=locate(recipient)||bank;
      const coin=document.createElement('span');coin.className='mono-cash-transfer';coin.textContent=new Intl.NumberFormat('ar-SA').format(Math.abs((source||recipient).player.cash-(source||recipient).before))+' ريال';game.appendChild(coin);
      const point=rect=>({x:rect.left+rect.width/2-bounds.left,y:rect.top+rect.height/2-bounds.top});
      const a=point(origin),b=point(destination);
      void animate(coin,[{transform:`translate(${a.x}px,${a.y}px) scale(.7)`,opacity:0},{transform:`translate(${a.x}px,${a.y}px) scale(1)`,opacity:1,offset:.12},{transform:`translate(${(a.x+b.x)/2+35}px,${(a.y+b.y)/2}px) scale(1.1)`,opacity:1,offset:.5},{transform:`translate(${b.x}px,${b.y}px) scale(.8)`,opacity:0}],{duration:800,easing:'ease-in-out'}).finally(()=>coin.remove());
    }
    const start=performance.now(),duration=reduced()?0:800;
    await new Promise(resolve=>{function frame(now){if(ticket!==epoch){resolve();return;}const t=duration?Math.min(1,(now-start)/duration):1;nodes.forEach(row=>{if(row.cash)row.cash.textContent='الرصيد '+new Intl.NumberFormat('ar-SA').format(Math.round(row.before+(row.player.cash-row.before)*t));});if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    nodes.forEach(row=>row.bubble.remove());
  }
  function decorateCard(stage,key){const card=getElement('monoOverlay')?.querySelector('.mono-interactive-card');if(!card||cardEffects.has(key))return;cardEffects.add(key);if(cardEffects.size>100)cardEffects.delete(cardEffects.values().next().value);card.dataset.animatedKey=key;if(stage==='back'){sound('draw');void animate(card,[{transform:'translateY(75px) rotate(-12deg) scale(.75)',opacity:0},{transform:'translateY(0) rotate(0) scale(1)',opacity:1}],{duration:600,easing:'cubic-bezier(.2,.8,.3,1)'});}if(stage==='face'){sound('flip');void animate(card,[{transform:'perspective(700px) rotateY(90deg)',opacity:.4},{transform:'perspective(700px) rotateY(0deg)',opacity:1}],{duration:550,easing:'ease-out'});}}
  function cancel(){epoch++;cancelAnimationFrame(zoomFrame);manualCamera=false;effects.forEach(a=>a.cancel());effects.clear();voices.forEach(source=>{try{source.stop();}catch{}});voices.clear();pointers.clear();document.querySelectorAll('.mono-money-flight,.mono-cash-transfer,#monoAnnouncement,#monoTurnProgress').forEach(n=>n.remove());overview();}
  function install(){
    if(installed)return;installed=true;
    if(!document.querySelector('[data-mono-interaction]')){const style=document.createElement('link');style.rel='stylesheet';style.href='src/modules/games/monopoly/monopoly-interaction.css';style.dataset.monoInteraction='1';document.head.appendChild(style);}
    // The camera moves the board; the event panel remains a readable, stationary layer.
    const old=getElement('monoCenter'),w=wrap();if(old&&w&&old.parentElement===board()){old.id='monoBoardCenter';const stage=document.createElement('section');stage.id='monoCenter';stage.className='mono-center';stage.setAttribute('aria-label','ساحة أحداث اللعبة');stage.append(getElement('monoControlPanel'),getElement('monoOverlay'));w.appendChild(stage);}
    const dice=getElement('monoDice');let drag=null;
    dice?.addEventListener('pointerdown',event=>{unlockAudio();const die=event.target.closest('.mono-die');if(!die||!canRoll())return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,die};die.setPointerCapture?.(event.pointerId);});
    dice?.addEventListener('pointermove',event=>{if(drag?.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.die.style.transform=`translate(${Math.max(-35,Math.min(35,dx))}px,${Math.max(-35,Math.min(35,dy))}px) rotate(${dx/3}deg)`;});
    dice?.addEventListener('pointerup',event=>{if(drag?.id!==event.pointerId)return;const distance=Math.hypot(event.clientX-drag.x,event.clientY-drag.y);drag.die.style.transform='';drag=null;if(distance>9){suppressClickUntil=performance.now()+600;onRoll();}});
    dice?.addEventListener('pointercancel',()=>{if(drag)drag.die.style.transform='';drag=null;});
    dice?.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    getElement('monoGame')?.addEventListener('pointerdown',unlockAudio,{passive:true});
    getElement('monoGame')?.addEventListener('keydown',unlockAudio);
    let gesture=null;
    w?.addEventListener('pointerdown',event=>{if(event.target.closest('#monoCenter,#monoGameTools')||event.button>0)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const rect=w.getBoundingClientRect();if(pointers.size===2){manualCamera=true;const values=[...pointers.values()];gesture={distance:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),scale,pan:{...pan},center:{x:(values[0].x+values[1].x)/2-rect.left,y:(values[0].y+values[1].y)/2-rect.top}};for(const id of pointers.keys())w.setPointerCapture?.(id);suppressClickUntil=performance.now()+700;}else if(scale>1.05){manualCamera=true;gesture={point:{x:event.clientX,y:event.clientY},pan:{...pan},scale};w.setPointerCapture?.(event.pointerId);}});
    w?.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId)||!gesture)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});let z=scale,x=pan.x,y=pan.y;if(pointers.size===2&&gesture.distance){const values=[...pointers.values()];z=Math.max(1,Math.min(2.8,gesture.scale*Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)/Math.max(1,gesture.distance)));const rect=w.getBoundingClientRect(),cx=(values[0].x+values[1].x)/2-rect.left,cy=(values[0].y+values[1].y)/2-rect.top;x=cx-(gesture.center.x-gesture.pan.x)*z/gesture.scale;y=cy-(gesture.center.y-gesture.pan.y)*z/gesture.scale;}else if(gesture.point){x=gesture.pan.x+event.clientX-gesture.point.x;y=gesture.pan.y+event.clientY-gesture.point.y;}const b=board();if(!b)return;scale=z;pan={x:Math.max(b.offsetWidth*(1-z),Math.min(0,x)),y:Math.max(b.offsetHeight*(1-z),Math.min(0,y))};b.style.transition='none';b.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${scale})`;syncZoom(true);suppressClickUntil=performance.now()+700;});
    function endPointer(event){const wasGesture=Boolean(gesture);pointers.delete(event.pointerId);if(pointers.size<2)gesture=null;if(wasGesture)return;const now=performance.now();if(now-lastTap<320){overview();suppressClickUntil=now+400;}lastTap=now;}
    w?.addEventListener('pointerup',endPointer);w?.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);gesture=null;});
    w?.addEventListener('click',event=>{if(!event.target.closest('#monoCenter')&&performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    const reset=document.createElement('button');reset.type='button';reset.className='mono-camera-reset';reset.textContent='اللوحة كاملة';reset.setAttribute('aria-label','إعادة عرض اللوحة كاملة');reset.addEventListener('click',overview);const tools=getElement('monoGameTools');if(tools){const toolbar=document.createElement('div');toolbar.className='mono-toolbar';tools.before(toolbar);toolbar.append(tools,reset);}else w?.appendChild(reset);
  }
  return{install,roll,focus,overview,followSegment,progress,eventScene,money,ownership,announce,sound,unlockAudio,decorateCard,cancel};
}
