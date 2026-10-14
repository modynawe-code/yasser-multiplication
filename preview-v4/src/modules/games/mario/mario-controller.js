import { ensureMarioShell } from './mario-shell.js';
import {marioRomFingerprint,readMarioSave,writeMarioSave,MARIO_SAVE_INTERVAL_MS} from './mario-save.js';

const byId=id=>document.getElementById(id);
const GAMEPAD_BUTTONS=Object.freeze({0:'A',1:'B',8:'SELECT',9:'START',12:'UP',13:'DOWN',14:'LEFT',15:'RIGHT'});

export function readMarioGamepadInputs(gamepad){
  if(!gamepad?.connected||gamepad.mapping!=='standard')return [];
  const inputs=[];
  for(const [index,name] of Object.entries(GAMEPAD_BUTTONS)){
    const button=gamepad.buttons?.[Number(index)];
    if(button?.pressed||(button?.value??0)>0.5)inputs.push(name);
  }
  const [x=0,y=0]=gamepad.axes??[];
  if(x<=-0.55)inputs.push('LEFT');else if(x>=0.55)inputs.push('RIGHT');
  if(y<=-0.55)inputs.push('UP');else if(y>=0.55)inputs.push('DOWN');
  return [...new Set(inputs)];
}

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
  let gamepadFrame=0,saveTimer=0,romId='';
  let saveBlocked=false;
  const heldInputs=new Map();
  const touchPointers=new Map();
  let viewportBound=false;
  let heldGamepadInputs=new Map();
  const KEY_BUTTONS=Object.freeze({ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',KeyZ:'B',KeyX:'A',Enter:'START',ShiftRight:'SELECT'});
  function status(message,error=false){const node=byId('marioStatus');if(node){node.textContent=message;node.classList.toggle('error',error);}}
  function setControlsEnabled(enabled){document.querySelectorAll('[data-mario-button]').forEach(button=>{button.disabled=!enabled;});const pause=byId('marioPause'),reset=byId('marioReset');if(pause)pause.disabled=!enabled;if(reset)reset.disabled=!enabled;const save=byId('marioSave');if(save)save.disabled=!enabled;}
  function saveProgress(manual=false){
    if(!loaded||!browser?.nes||(!manual&&saveBlocked))return false;
    let result;
    try{result=writeMarioSave(globalThis.localStorage,romId,browser.nes);}catch{result={ok:false};}
    const label=byId('marioSaveStatus');
    if(result.ok){
      saveBlocked=false;
      const time=new Date(result.savedAt).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
      if(label){label.textContent=`آخر حفظ: ${time}`;label.classList.remove('error');}
      if(manual)status('تم حفظ اللعبة. تقدر تطلع وتكمل من هنا.');
    }else{
      if(label){label.textContent='تعذر الحفظ على هذا المتصفح';label.classList.add('error');}
      status('تعذر حفظ اللعبة. قد تكون مساحة المتصفح ممتلئة؛ لا تغلقها قبل نجاح الحفظ.',true);
    }
    return result.ok;
  }
  function stopAutosave(){if(saveTimer)globalThis.clearInterval(saveTimer);saveTimer=0;}
  function startAutosave(){
    stopAutosave();saveTimer=globalThis.setInterval(()=>{if(!paused&&document.visibilityState!=='hidden')saveProgress();},MARIO_SAVE_INTERVAL_MS);
  }
  function suspendAndSave(){
    if(!loaded||!browser)return;
    releaseAll();
    if(!paused){browser.stop();paused=true;byId('marioPause').textContent='متابعة اللعب';}
    saveProgress();
  }
  function paintSavedFrame(state){
    const canvas=byId('marioScreen')?.querySelector?.('canvas');if(!canvas)return;
    const context=canvas.getContext('2d');if(!context)return;
    const frame=context.createImageData(256,240);
    for(let i=0;i<state.ppu.buffer.length;i++){
      const color=state.ppu.buffer[i],offset=i*4;
      frame.data[offset]=color&255;frame.data[offset+1]=(color>>>8)&255;
      frame.data[offset+2]=(color>>>16)&255;frame.data[offset+3]=255;
    }
    context.putImageData(frame,0,0);
  }
  function setInput(name,source,down){
    const button=globalThis.jsnes?.Controller?.[`BUTTON_${name}`];if(button===undefined)return;
    let sources=heldInputs.get(name);
    if(down){
      if(!loaded||paused||!browser?.nes)return;
      if(!sources){sources=new Set();heldInputs.set(name,sources);}
      if(sources.has(source))return;
      if(!sources.size)browser.nes.buttonDown(1,button);
      sources.add(source);
      markHeld(name,true);
      return;
    }
    if(!sources||!sources.has(source))return;
    sources.delete(source);
    if(!sources.size){heldInputs.delete(name);browser?.nes?.buttonUp(1,button);markHeld(name,false);}
  }
  function markHeld(name,held){
    const node=document.querySelector(`[data-mario-button="${name}"]`);
    node?.classList.toggle('is-held',held);node?.setAttribute('aria-pressed',String(held));
  }
  function fitViewport(){
    const view=byId('marioGameView');if(!view)return;
    const viewport=globalThis.visualViewport;
    view.style.setProperty('--mario-viewport-height',`${viewport?.height??globalThis.innerHeight}px`);
    view.style.setProperty('--mario-viewport-top',`${viewport?.offsetTop??0}px`);
  }
  function trackViewport(enabled){
    if(enabled===viewportBound)return;viewportBound=enabled;
    const method=enabled?'addEventListener':'removeEventListener';
    globalThis[method]?.('resize',fitViewport);
    globalThis.visualViewport?.[method]('resize',fitViewport);
    globalThis.visualViewport?.[method]('scroll',fitViewport);
    if(enabled)fitViewport();
  }
  function releaseAll(){
    if(browser?.nes){for(const name of heldInputs.keys()){const button=globalThis.jsnes?.Controller?.[`BUTTON_${name}`];if(button!==undefined)browser.nes.buttonUp(1,button);}}
    for(const name of heldInputs.keys())markHeld(name,false);
    heldInputs.clear();heldGamepadInputs.clear();touchPointers.clear();
  }
  function pollGamepads(){
    gamepadFrame=0;
    const next=new Map();
    if(loaded&&!paused&&document.visibilityState!=='hidden'&&typeof navigator.getGamepads==='function'){
      try{
        for(const gamepad of navigator.getGamepads()){
          if(!gamepad)continue;
          for(const name of readMarioGamepadInputs(gamepad))next.set(`gamepad:${gamepad.index}:${name}`,name);
        }
      }catch{}
    }
    for(const [source,name] of heldGamepadInputs)if(!next.has(source))setInput(name,source,false);
    for(const [source,name] of next)if(!heldGamepadInputs.has(source))setInput(name,source,true);
    heldGamepadInputs=next;
    if(bound&&globalThis.requestAnimationFrame)gamepadFrame=globalThis.requestAnimationFrame(pollGamepads);
  }
  function startGamepadPolling(){
    if(!gamepadFrame&&typeof navigator.getGamepads==='function'&&globalThis.requestAnimationFrame)gamepadFrame=globalThis.requestAnimationFrame(pollGamepads);
  }
  function stopGamepadPolling(){
    if(gamepadFrame)globalThis.cancelAnimationFrame?.(gamepadFrame);
    gamepadFrame=0;
    for(const [source,name] of heldGamepadInputs)setInput(name,source,false);
    heldGamepadInputs.clear();
  }
  function onGamepadConnected(){status('يد التحكم جاهزة. استخدموا الأسهم أو العصا وأزرارها.');}
  function onGamepadDisconnected(event){
    const prefix=`gamepad:${event.gamepad?.index}:`;
    for(const [source,name] of heldGamepadInputs)if(source.startsWith(prefix)){setInput(name,source,false);heldGamepadInputs.delete(source);}
    status('انفصلت يد التحكم. اللمس ولوحة المفاتيح ما زالا يعملان.');
  }
  function press(name,event){
    if(!loaded||paused||!browser?.nes)return;
    touchPointers.set(event.pointerId,{name,node:event.currentTarget});
    setInput(name,event.pointerId,true);
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
  }
  function movePointer(event){
    const held=touchPointers.get(event.pointerId);if(!held)return;
    const rect=held.node.getBoundingClientRect();
    // Moving out releases this button; it never presses an adjacent target.
    const inside=event.clientX>=rect.left&&event.clientX<rect.right&&event.clientY>=rect.top&&event.clientY<rect.bottom;
    setInput(held.name,event.pointerId,inside);
  }
  function release(name,event){setInput(name,event.pointerId,false);touchPointers.delete(event.pointerId);}
  function onKeyDown(event){
    const name=KEY_BUTTONS[event.code];
    if(!name||event.target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]'))return;
    if(!loaded||paused||event.repeat)return;
    event.preventDefault();setInput(name,`key:${event.code}`,true);
  }
  function onKeyUp(event){
    const name=KEY_BUTTONS[event.code];if(!name)return;
    setInput(name,`key:${event.code}`,false);
  }
  async function loadRom(){
    const token=++loadToken;
    stopAutosave();saveBlocked=false;status('نحمّل اللعبة…');
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
        browser.loadROM(bytes);romId=marioRomFingerprint(bytes);loaded=true;paused=false;setControlsEnabled(true);
      }catch(error){browser?.destroy();browser=null;throw error;}
      let restored=false;
      let saved;
      try{saved=readMarioSave(globalThis.localStorage,romId);}catch{saved={status:'unavailable'};}
      if(saved.status==='ready'){
        browser.stop();
        try{
          browser.nes.fromJSON(saved.saved.state);paused=true;restored=true;
          paintSavedFrame(saved.saved.state);
          byId('marioSaveStatus').textContent='تم استعادة آخر حفظ';byId('marioSaveStatus').classList.remove('error');
        }catch{browser.loadROM(bytes);paused=false;saved={status:'invalid'};}
      }
      byId('marioPause').textContent=restored?'متابعة اللعب':'إيقاف مؤقت';
      if(restored)status('رجعنا لآخر حفظ. اضغط متابعة اللعب عشان تكمل.');
      else if(saved.status!=='empty'){
        saveBlocked=true;status('تعذر استعادة الحفظ السابق. تقدر تبدأ من جديد؛ الحفظ القديم يبقى إلى أن تضغط حفظ الآن أو إعادة البداية.',true);
      }else status('اللعبة جاهزة. تقدمك ينحفظ تلقائيًا على هذا الجهاز.');
      startAutosave();
    }catch(error){
      if(token!==loadToken)return;
      loaded=false;setControlsEnabled(false);
      status(error?.message==='invalid-rom'?'ملف اللعبة المرفق غير صالح.':'تعذر تحميل اللعبة. افتحوا التطبيق مرة واحدة مع الاتصال ثم جرّبوا.',true);
    }
  }
  function togglePause(){
    if(!browser||!loaded)return;
    if(paused){browser.start();paused=false;byId('marioPause').textContent='إيقاف مؤقت';status('اللعبة مستمرة.');}
    else{releaseAll();browser.stop();paused=true;byId('marioPause').textContent='متابعة اللعب';if(saveProgress())status('اللعبة متوقفة ومحفوظة.');}
  }
  function reset(){if(!browser||!loaded)return;releaseAll();if(!globalThis.confirm('تبدأ من جديد وتستبدل الحفظ الحالي؟'))return;browser.nes.reset();saveBlocked=false;const saved=saveProgress(true);if(paused){browser.start();paused=false;byId('marioPause').textContent='إيقاف مؤقت';}if(saved)status('رجعنا لبداية اللعبة وحفظناها.');}
  function clearImmersive(exitNative=false){
    const view=byId('marioGameView'),button=byId('marioFullscreen');
    view?.classList.remove('mario-fullscreen');
    if(button){button.textContent='ملء الشاشة';button.setAttribute('aria-pressed','false');}
    try{globalThis.screen?.orientation?.unlock?.();}catch{}
    if(exitNative&&document.fullscreenElement)Promise.resolve(document.exitFullscreen?.()).catch(()=>{});
  }
  async function toggleFullscreen(){
    const view=byId('marioGameView');
    if(!view)return;
    if(view.classList.contains('mario-fullscreen')){clearImmersive(true);status('رجعنا لوضع الصفحة.');return;}
    view.classList.add('mario-fullscreen');
    const button=byId('marioFullscreen');if(button){button.textContent='تصغير الشاشة';button.setAttribute('aria-pressed','true');}
    try{if(view.requestFullscreen)await view.requestFullscreen({navigationUI:'hide'});}catch{}
    fitViewport();
    status('الشاشة كاملة. لفّ الجهاز بالعرض لمساحة لعب أوسع.');
  }
  function cleanup(){releaseAll();saveProgress();stopAutosave();trackViewport(false);loadToken+=1;stopGamepadPolling();releaseAll();clearImmersive(true);browser?.destroy();browser=null;loaded=false;paused=false;document.body.classList.remove('mario-game-mode');}
  function bind(){
    if(bound)return;bound=true;
    byId('marioBackToGames')?.addEventListener('click',()=>{releaseAll();if(loaded&&!saveProgress()&&!globalThis.confirm('تعذر حفظ تقدمك. تطلع بدون حفظ؟'))return;cleanup();onBack?.();});
    byId('marioSave')?.addEventListener('click',()=>saveProgress(true));
    byId('marioPause')?.addEventListener('click',togglePause);byId('marioReset')?.addEventListener('click',reset);byId('marioFullscreen')?.addEventListener('click',()=>void toggleFullscreen());
    document.addEventListener('keydown',onKeyDown);document.addEventListener('keyup',onKeyUp);
    globalThis.addEventListener?.('gamepadconnected',onGamepadConnected);globalThis.addEventListener?.('gamepaddisconnected',onGamepadDisconnected);
    document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&byId('marioGameView')?.classList.contains('mario-fullscreen'))clearImmersive();});
    globalThis.addEventListener?.('blur',suspendAndSave);
    globalThis.addEventListener?.('pagehide',suspendAndSave);
    document.querySelectorAll('[data-mario-button]').forEach(button=>{
      const name=button.dataset.marioButton;
      button.setAttribute('aria-pressed','false');
      button.addEventListener('pointermove',movePointer);
      button.addEventListener('pointerdown',event=>{event.preventDefault();press(name,event);});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{event.preventDefault();release(name,event);});
      button.addEventListener('contextmenu',event=>event.preventDefault());
    });
    globalThis.document?.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')suspendAndSave();});
    setControlsEnabled(false);
  }
  return Object.freeze({
    start(){ensureMarioShell();document.body.classList.add('mario-game-mode');bind();startGamepadPolling();showView?.('marioGameView');trackViewport(true);void loadRom();},
    leave:cleanup
  });
}
