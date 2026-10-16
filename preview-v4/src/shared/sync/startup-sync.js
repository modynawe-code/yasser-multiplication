// Bound startup work without abandoning a request that could restore over active play.
export async function runStartupSync(sync,{setSignal=()=>{},timeoutMs=3500}={}){
  const controller=new AbortController();
  setSignal(controller.signal);
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await sync();}
  catch{return false;}
  finally{clearTimeout(timer);setSignal(undefined);}
}
