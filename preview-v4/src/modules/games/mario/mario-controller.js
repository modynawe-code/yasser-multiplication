import { ensureMarioShell } from './mario-shell.js';

const byId=id=>document.getElementById(id);

function loadJsnes(){
  if(globalThis.jsnes?.Browser)return Promise.resolve(globalThis.jsnes);
  if(globalThis.__familyJsnesPromise)return globalThis.__familyJsnesPromise;
  globalThis.__familyJsnesPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='src/vendor/jsnes.min.js';script.async=true;
    script.onload=()=>{if(globalThis.jsnes?.Browser)resolve(globalThis.jsnes);else{globalThis.__familyJsnesPromise=null;reject(new Error('jsnes global missing'));}};
    script.onerror=()=>{globalThis.__familyJsnesPromise=null;reject(new Error('jsnes could not load'));};
    document.head.appendChild(script);
  });
  return globalThis.__familyJsnesPromise;
}

export function createMarioController({showView,onBack}={}){
  let bound=false,browser=null,loaded=false,paused=false,loadToken=0;
  const heldPointers=new Map();
  function status(message,error=false){const node=byId('marioStatus');if(node){node.textContent=message;node.classList.toggle('error',error);}}
  function setControlsEnabled(enabled){document.querySelectorAll('[data-mario-button]').forEach(button=>{button.disabled=!enabled;});const pause=byId('marioPause'),reset=byId('marioReset');if(pause)pause.disabled=!enabled;if(reset)reset.disabled=!enabled;}
  function releaseAll(){
    if(browser?.nes){for(const name of heldPointers.keys()){const button=globalThis.jsnes?.Controller?.[`BUTTON_${name}`];if(button!==undefined)browser.nes.buttonUp(1,button);}}
    heldPointers.clear();
  }
  function press(name,event){
    if(!loaded||!browser?.nes)return;
    const button=globalThis.jsnes?.Controller?.[`BUTTON_${name}`];if(button===undefined)return;
    const pointers=heldPointers.get(name)||new Set();if(pointers.has(event.pointerId))return;
    if(!pointers.size)browser.nes.buttonDown(1,button);
    pointers.add(event.pointerId);heldPointers.set(name,pointers);
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
  }
  function release(name,event){
    const pointers=heldPointers.get(name);if(!pointers)return;
    pointers.delete(event.pointerId);
    if(!pointers.size){heldPointers.delete(name);const button=globalThis.jsnes?.Controller?.[`BUTTON_${name}`];if(button!==undefined)browser?.nes?.buttonUp(1,button);}
  }
  async function loadRom(){
    const token=++loadToken;
    status('نحمّل اللعبة…');
    try{
      const jsnes=await loadJsnes();
      const response=await fetch(new URL('assets/games/super-mario-bros.nes',document.baseURI));
      if(!response.ok)throw new Error('rom-not-found');
      const bytes=new Uint8Array(await response.arrayBuffer());
      if(token!==loadToken)return;
      if(bytes.length<16||bytes[0]!==0x4e||bytes[1]!==0x45||bytes[2]!==0x53||bytes[3]!==0x1a)throw new Error('invalid-rom');
      releaseAll();browser?.destroy();browser=null;loaded=false;setControlsEnabled(false);
      const screen=byId('marioScreen');screen.replaceChildren();
      try{
        browser=new jsnes.Browser({container:screen,onError:()=>status('تعذر تشغيل اللعبة. أعدوا فتحها وجربوا مرة ثانية.',true)});
        browser.loadROM(bytes);loaded=true;paused=false;setControlsEnabled(true);
      }catch(error){browser?.destroy();browser=null;throw error;}
      byId('marioPause').textContent='إيقاف مؤقت';status('اللعبة جاهزة. العبوا باللمس أو لوحة المفاتيح.');
    }catch(error){
      if(token!==loadToken)return;
      loaded=false;setControlsEnabled(false);
      status(error?.message==='invalid-rom'?'ملف اللعبة المرفق غير صالح.':'تعذر تحميل اللعبة. افتحوا التطبيق مرة واحدة مع الاتصال ثم جرّبوا.',true);
    }
  }
  function togglePause(){
    if(!browser||!loaded)return;
    if(paused){browser.start();paused=false;byId('marioPause').textContent='إيقاف مؤقت';status('اللعبة مستمرة.');}
    else{releaseAll();browser.stop();paused=true;byId('marioPause').textContent='متابعة اللعب';status('اللعبة متوقفة مؤقتًا.');}
  }
  function reset(){if(!browser||!loaded)return;releaseAll();browser.nes.reset();if(paused){browser.start();paused=false;byId('marioPause').textContent='إيقاف مؤقت';}status('رجعنا لبداية اللعبة.');}
  function cleanup(){loadToken+=1;releaseAll();browser?.destroy();browser=null;loaded=false;paused=false;document.body.classList.remove('mario-game-mode');}
  function bind(){
    if(bound)return;bound=true;
    byId('marioBackToGames')?.addEventListener('click',()=>{cleanup();onBack?.();});
    byId('marioPause')?.addEventListener('click',togglePause);byId('marioReset')?.addEventListener('click',reset);
    document.querySelectorAll('[data-mario-button]').forEach(button=>{
      const name=button.dataset.marioButton;
      button.addEventListener('pointerdown',event=>{event.preventDefault();press(name,event);});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{event.preventDefault();release(name,event);});
      button.addEventListener('contextmenu',event=>event.preventDefault());
    });
    globalThis.document?.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')releaseAll();});
    setControlsEnabled(false);
  }
  return Object.freeze({
    start(){ensureMarioShell();document.body.classList.add('mario-game-mode');bind();showView?.('marioGameView');void loadRom();},
    leave:cleanup
  });
}
