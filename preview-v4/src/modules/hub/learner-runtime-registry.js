function normalizeId(value){return String(value||'').trim().toLowerCase();}

export function createLearnerRuntimeRegistry(){
  const runtimes=new Map();

  function register(learnerId,runtime){
    const id=normalizeId(learnerId);
    if(!id)throw new Error('learner id is required');
    if(runtimes.has(id))throw new Error('learner runtime already registered');
    if(typeof runtime?.enter!=='function'||typeof runtime?.leave!=='function')throw new Error('learner runtime requires enter and leave');
    runtimes.set(id,Object.freeze({enter:runtime.enter,leave:runtime.leave}));
    return id;
  }

  function activate(learnerId){
    const id=normalizeId(learnerId),target=runtimes.get(id);
    if(!target)return false;
    for(const [registeredId,runtime] of runtimes){if(registeredId!==id)runtime.leave();}
    target.enter();
    return true;
  }

  function leaveAll(){for(const runtime of runtimes.values())runtime.leave();}

  return Object.freeze({
    register,
    activate,
    leaveAll,
    has(learnerId){return runtimes.has(normalizeId(learnerId));},
    listIds(){return [...runtimes.keys()];}
  });
}
