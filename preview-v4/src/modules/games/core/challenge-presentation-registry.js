const KIND_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createChallengePresentationRegistry(){
  const presenters=new Map();

  function register(kind,presenter){
    const id=String(kind||'').trim();
    if(!KIND_PATTERN.test(id))throw new TypeError(`invalid challenge presentation kind: ${id}`);
    if(presenters.has(id))throw new Error(`challenge presenter already registered: ${id}`);
    if(!presenter||typeof presenter!=='object')throw new TypeError('challenge presenter is required');
    if(typeof presenter.labelForOption!=='function')throw new TypeError('challenge presenter must implement labelForOption');
    presenters.set(id,Object.freeze({...presenter}));
    return presenters.get(id);
  }

  function get(kind){return presenters.get(String(kind||''))||null;}
  function has(kind){return presenters.has(String(kind||''));}
  function labelForOption(challenge,value){
    const presenter=get(challenge?.kind);
    return presenter?String(presenter.labelForOption(challenge,value)??value):String(value);
  }
  function renderStimulus(challenge,options={}){
    const presenter=get(challenge?.kind);
    return typeof presenter?.renderStimulus==='function'?presenter.renderStimulus(challenge,options):null;
  }
  function renderOption(challenge,value,options={}){
    const presenter=get(challenge?.kind);
    return typeof presenter?.renderOption==='function'?presenter.renderOption(challenge,value,options):null;
  }

  return Object.freeze({register,get,has,labelForOption,renderStimulus,renderOption});
}
