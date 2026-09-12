export function createGameLauncher({registry,playerService=null}={}){
  if(!registry?.get||!registry?.has)throw new TypeError('game registry is required');
  const launchers=new Map();

  function register(gameId,launch){
    const id=String(gameId||'').trim();
    if(!registry.has(id))throw new TypeError(`registered game is required: ${id}`);
    if(typeof launch!=='function')throw new TypeError('game launch handler must be a function');
    if(launchers.has(id))throw new Error(`game launcher already registered: ${id}`);
    launchers.set(id,launch);
    return registry.get(id);
  }

  function canLaunch(gameId){
    const id=String(gameId||'').trim();
    return Boolean(registry.has(id)&&launchers.has(id));
  }

  async function launch(gameId,context={}){
    const id=String(gameId||'').trim(),game=registry.get(id);
    if(!game)return Object.freeze({ok:false,reason:'unknown-game',game:null});
    const handler=launchers.get(id);
    if(!handler)return Object.freeze({ok:false,reason:'unavailable',game});
    const participants=playerService?.listEligible?.(game)||Object.freeze([]);
    try{
      const result=await handler(Object.freeze({...context,game,participants:Object.freeze([...participants])}));
      return Object.freeze({ok:true,reason:null,game,result});
    }catch(error){
      return Object.freeze({ok:false,reason:'launch-failed',game,error});
    }
  }

  return Object.freeze({register,canLaunch,launch});
}
