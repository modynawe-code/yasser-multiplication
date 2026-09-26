import { ensurePs1Shell } from './ps1-shell.js';

const DATA_PATH='https://cdn.emulatorjs.org/4.2.3/data/';
const byId=id=>document.getElementById(id);
const supportedExtensions=new Set(['chd','pbp','iso','bin','cue','zip']);
const BIOS_DB='family-learning-ps1';
const BIOS_STORE='firmware';
const BIOS_KEY='selected';

function openBiosDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(BIOS_DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(BIOS_STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function saveBios(file){
  const db=await openBiosDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(BIOS_STORE,'readwrite');
    tx.objectStore(BIOS_STORE).put({blob:file.slice(0,file.size,file.type||'application/octet-stream'),name:file.name,type:file.type},BIOS_KEY);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error||new Error('BIOS save aborted'));};
  });
}
async function getSavedBios(){
  const db=await openBiosDb();
  return new Promise((resolve,reject)=>{
    const request=db.transaction(BIOS_STORE,'readonly').objectStore(BIOS_STORE).get(BIOS_KEY);
    request.onsuccess=()=>{
      const saved=request.result;db.close();
      resolve(saved?new File([saved.blob],saved.name||'scph5501.bin',{type:saved.type||'application/octet-stream'}):null);
    };
    request.onerror=()=>{db.close();reject(request.error);};
  });
}

function fileExtension(file){return String(file?.name||'').split('.').pop().toLowerCase();}

export function createPs1Controller({showView,onBack}={}){
  let bound=false,started=false,loaderScript=null,fullscreenFallback=false,biosObjectUrl=null;

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
    if(biosObjectUrl){URL.revokeObjectURL(biosObjectUrl);biosObjectUrl=null;}
    if(globalThis.EJS_emulator)globalThis.EJS_emulator=null;
    const player=byId('ps1Player');if(player)player.replaceChildren();
  }

  function bind(){
    if(bound)return;bound=true;
    byId('ps1Back')?.addEventListener('click',()=>{leave();onBack?.();});
    byId('ps1Fullscreen')?.addEventListener('click',toggleFullscreen);
    byId('ps1Start')?.addEventListener('click',startGame);
    byId('ps1BiosFile')?.addEventListener('change',async event=>{
      const file=event.currentTarget.files?.[0];
      if(!file)return;
      if(fileExtension(file)!=='bin'){status('اختر ملف BIOS بصيغة BIN.',true);return;}
      try{await saveBios(file);status('تم حفظ BIOS ('+file.name+') على هذا الجهاز.',false);}
      catch{status('تعذر حفظ BIOS على هذا الجهاز؛ سيعمل للّعبة الحالية فقط.',true);}
    });
    document.addEventListener('fullscreenchange',()=>{
      const shell=document.querySelector('#ps1GameView .ps1-shell');
      if(document.fullscreenElement===shell)return;
      if(!fullscreenFallback&&byId('ps1Fullscreen')?.getAttribute('aria-pressed')==='true')clearFullscreen();
    });
  }

  async function startGame(){
    if(started)return;
    const rom=byId('ps1RomFile')?.files?.[0],biosInput=byId('ps1BiosFile'),start=byId('ps1Start');
    if(!rom){status('اختر ملف اللعبة أولًا.',true);return;}
    if(!supportedExtensions.has(fileExtension(rom))){status('صيغة ملف اللعبة غير مدعومة. جرّب CHD أو PBP.',true);return;}
    started=true;if(start)start.disabled=true;
    let bios=biosInput?.files?.[0]||null;
    if(!bios){try{bios=await getSavedBios();}catch{}}
    if(!bios){started=false;if(start)start.disabled=false;status('اختر ملف BIOS المتوافق مرة واحدة على هذا الجهاز.',true);return;}
    if(fileExtension(bios)!=='bin'){started=false;if(start)start.disabled=false;status('ملف BIOS يجب أن يكون بصيغة BIN.',true);return;}
    biosObjectUrl=URL.createObjectURL(bios);
    byId('ps1Setup').hidden=true;byId('ps1Stage').hidden=false;
    status('نحمّل ملفات المحاكي ثم نبدأ اللعبة…',false,true);
    Object.assign(globalThis,{
      // EmulatorJS identifies uploaded games using the File object's original name/extension.
      // A blob URL drops the .PBP suffix and can leave RetroArch at its empty main menu.
      EJS_player:'#ps1Player',EJS_core:'pcsx_rearmed',EJS_gameUrl:rom,EJS_biosUrl:biosObjectUrl,
      EJS_gameName:rom.name.replace(/\.[^.]+$/,''),EJS_pathtodata:DATA_PATH,
      EJS_language:'ar-SA',EJS_startOnLoaded:true,EJS_threads:false,
      EJS_askBeforeExit:false,EJS_disableLocalStorage:false,
      EJS_ready:()=>status('المحاكي جاهز. استخدم يد التحكم أو أزرار اللمس الظاهرة.',false,true),
      EJS_onGameStart:()=>status('بدأت اللعبة. إذا كان الصوت يعمل والصورة سوداء، فملف BIOS المتوافق مطلوب لهذه اللعبة.',false,true),
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
    status('اختر ملف اللعبة؛ ملف BIOS يُحفظ محليًا بعد اختياره مرة واحدة.');
  }

  function leave(){
    clearFullscreen();stopEmulator();
    byId('ps1Setup')?.removeAttribute('hidden');byId('ps1Stage')?.setAttribute('hidden','');
    const button=byId('ps1Start');if(button)button.disabled=false;
  }

  return Object.freeze({start,leave});
}
