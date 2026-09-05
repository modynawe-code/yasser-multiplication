export async function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return{supported:false};
  try{
    const registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
    registration.update().catch(()=>{});
    return{supported:true,registration};
  }catch(error){
    console.warn('Service worker registration failed',error);
    return{supported:true,error};
  }
}
