import { ensurePs1Shell } from './ps1-shell.js';

const DATA_PATH='https://cdn.emulatorjs.org/4.2.3/data/';
const byId=id=>document.getElementById(id);
const supportedExtensions=new Set(['chd','pbp','iso','bin','cue','zip']);

function fileExtension(file){return String(file?.name||'').split('.').pop().toLowerCase();}

export function createPs1Controller({showView,onBack}={}){
  let bound=false,started=false,loaderScript=null,fullscreenFallback=false;

  function status(message,error=false,stage=false){
    const node=byId(stage?'ps1StageStatus':'ps1Status');
    if(node){node.textContent=message;node.classList.toggle('error',error);}
  }

  function clearFullscreen(){
    const shell=document.querySelector('#ps1GameView .ps1-shell'),button=byId('ps1Fullscreen');
    fullscreenFallback=false;shell?.classList.remove('ps1-css-fullscreen');
    if(button){button.textContent='ملء الشاشة';button.setAttribute('aria-pressed','false');}
  }

  function toggleFullscreen(){
    const shell=document.querySelector('#ps1GameView .ps1-shell'),button=byId('ps1Fullscreen');
    if(!shell)return;
    if(document.fullscreenElement===shell||fullscreenFallback){
      if(document.fullscreenElement===shell)Promise.resolve(document.exitFullscreen?.()).catch(()=>{});
      clearFullscreen();return;
    }
    const request=shell.requestFullscreen?.bind(shell);
    if(request){
      Promise.resolve(request()).then(()=>{
        button.textContent='إنهاء ملء الشاشة';button.setAttribute('aria-pressed','true');
        try{screen.orientation?.lock?.('landscape')?.catch?.(()=>{});}catch{}
      }).catch(()=>{
        fullscreenFallback=true;shell.classList.add('ps1-css-fullscreen');button.textContent='إنهاء ملء الشاشة';button.setAttribute('aria-pressed','true');
      });
      return;
    }
    fullscreenFallback=true;shell.classList.add('ps1-css-fullscreen');button.textContent='إنهاء ملء الشاشة';button.setAttribute('aria-pressed','true');
  }

  function stopEmulator(){
    try{globalThis.EJS_terminate?.();}catch{}
    loaderScript?.remove();loaderScript=null;started=false;
    if(globalThis.EJS_emulator)globalThis.EJS_emulator=null;
    const player=byId('ps1Player');if(player)player.replaceChildren();
  }

  function bind(){
    if(bound)return;bound=true;
    byId('ps1Back')?.addEventListener('click',()=>{leave();onBack?.();});
    byId('ps1Fullscreen')?.addEventListener('click',toggleFullscreen);
    byId('ps1Start')?.addEventListener('click',startGame);
    document.addEventListener('fullscreenchange',()=>{
      const shell=document.querySelector('#ps1GameView .ps1-shell');
      if(document.fullscreenElement===shell)return;
      if(!fullscreenFallback&&byId('ps1Fullscreen')?.getAttribute('aria-pressed')==='true')clearFullscreen();
    });
  }

  function startGame(){
    if(started)return;
    const rom=byId('ps1RomFile')?.files?.[0],bios=byId('ps1BiosFile')?.files?.[0],start=byId('ps1Start');
    if(!rom){status('اختر ملف اللعبة أولًا.',true);return;}
    if(!supportedExtensions.has(fileExtension(rom))){status('صيغة ملف اللعبة غير مدعومة. جرّب CHD أو PBP.',true);return;}
    if(!bios){status('اختر ملف BIOS تملكه ومتوافقًا مع منطقة اللعبة.',true);return;}
    if(fileExtension(bios)!=='bin'){status('ملف BIOS المعتاد امتداده BIN.',true);return;}
    started=true;if(start)start.disabled=true;
    byId('ps1Setup').hidden=true;byId('ps1Stage').hidden=false;
    status('نحمّل ملفات المحاكي ثم نبدأ اللعبة…',false,true);
    Object.assign(globalThis,{
      EJS_player:'#ps1Player',EJS_core:'psx',EJS_gameUrl:rom,EJS_biosUrl:bios,
      EJS_gameName:rom.name.replace(/\.[^.]+$/,''),EJS_pathtodata:DATA_PATH,
      EJS_language:'ar-SA',EJS_startOnLoaded:true,EJS_threads:false,
      EJS_askBeforeExit:false,EJS_disableLocalStorage:false,
      EJS_ready:()=>status('المحاكي جاهز. استخدم يد التحكم أو أزرار اللمس الظاهرة.',false,true),
      EJS_onGameStart:()=>status('اللعبة تعمل.',false,true),
      EJS_onExit:()=>status('انتهى تشغيل المحاكي.',false,true)
    });
    loaderScript?.remove();loaderScript=document.createElement('script');loaderScript.async=true;loaderScript.src=`${DATA_PATH}loader.js`;
    loaderScript.onerror=()=>{
      started=false;if(start)start.disabled=false;
      status('تعذر تحميل المحاكي. تحقق من الاتصال ثم أعد المحاولة.',true,true);
    };
    document.head.appendChild(loaderScript);
  }

  function start(){
    ensurePs1Shell();bind();
    byId('ps1Setup').hidden=false;byId('ps1Stage').hidden=true;
    const button=byId('ps1Start');if(button)button.disabled=false;
    showView?.('ps1GameView');
    status('اختر لعبة PS1 وBIOS من ملفات جهازك.');
  }

  function leave(){
    clearFullscreen();stopEmulator();
    byId('ps1Setup')?.removeAttribute('hidden');byId('ps1Stage')?.setAttribute('hidden','');
    const button=byId('ps1Start');if(button)button.disabled=false;
  }

  return Object.freeze({start,leave});
}
