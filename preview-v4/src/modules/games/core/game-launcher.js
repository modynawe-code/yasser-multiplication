export function createGameLauncher({registry,playerService=null}={}){
  if(!registry?.get||!registry?.has)throw new TypeError('game registry is required');
  const launchers=new Map(),dynamicLaunchers=new Map();

  function register(gameId,launch){
    const id=String(gameId||'').trim();
    if(!registry.has(id))throw new TypeError(`registered game is required: ${id}`);
    if(typeof launch!=='function')throw new TypeError('game launch handler must be a function');
    if(launchers.has(id))throw new Error(`game launcher already registered: ${id}`);
    launchers.set(id,launch);
    return registry.get(id);
  }

  function canLaunch(gameId){
    const id=String(gameId||'').trim(),game=registry.get(id);
    return Boolean(game&&(launchers.has(id)||dynamicLaunchers.has(id)||typeof game.load==='function'));
  }

  async function dynamicHandler(game){
    if(dynamicLaunchers.has(game.id))return dynamicLaunchers.get(game.id);
    if(typeof game.load!=='function')return null;
    const module=await game.load();
    const handler=module?.launchGame||module?.default;
    if(typeof handler!=='function')throw new TypeError(`dynamic game launch handler required: ${game.id}`);
    dynamicLaunchers.set(game.id,handler);
    return handler;
  }

  async function launch(gameId,context={}){
    const id=String(gameId||'').trim(),game=registry.get(id);
    if(!game)return Object.freeze({ok:false,reason:'unknown-game',game:null});
    try{
      const handler=launchers.get(id)||await dynamicHandler(game);
      if(!handler)return Object.freeze({ok:false,reason:'unavailable',game});
      const participants=playerService?.listEligible?.(game)||Object.freeze([]);
      const result=await handler(Object.freeze({...context,game,participants:Object.freeze([...participants])}));
      return Object.freeze({ok:true,reason:null,game,result});
    }catch(error){
      return Object.freeze({ok:false,reason:'launch-failed',game,error});
    }
  }

  return Object.freeze({register,canLaunch,launch});
}
