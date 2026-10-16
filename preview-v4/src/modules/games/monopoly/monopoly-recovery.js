// Reconnect a visible game without resetting its board or opening setup.
export function installMonopolyRecovery({target=globalThis,document=globalThis.document,isActive,recover,suspend,disconnected,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let pending=null,timer=null,attempt=0,generation=0;
  function clearRetry(){if(timer!==null)clearTimer(timer);timer=null;}
  function reconnect(){
    if(!isActive?.()||document?.visibilityState==='hidden')return Promise.resolve(null);
    if(pending)return pending;
    clearRetry();const current=generation;
    const task=Promise.resolve().then(()=>current===generation?recover?.():null).then(result=>{
      if(current===generation&&result===false&&isActive?.()&&document?.visibilityState!=='hidden'){
        timer=setTimer(()=>{timer=null;void reconnect();},Math.min(15000,1000*2**attempt++));
      }else if(result!==false)attempt=0;
      return result;
    }).finally(()=>{if(pending===task)pending=null;});
    pending=task;return task;
  }
  function pause(){generation++;clearRetry();pending=null;if(isActive?.())suspend?.();}
  target.addEventListener('pageshow',event=>{if(event.persisted)void reconnect();});
  target.addEventListener('pagehide',pause);
  target.addEventListener('online',()=>{attempt=0;void reconnect();});
  target.addEventListener('offline',()=>{if(isActive?.())disconnected?.();});
  document?.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pause();else void reconnect();});
  return Object.freeze({reconnect,pause});
}
