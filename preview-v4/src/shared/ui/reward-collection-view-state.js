const VERSION=1;

function safeStorage(storage){
  if(storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function')return storage;
  const memory=new Map();
  return {
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>memory.set(key,String(value))
  };
}

function normalize(value){
  const source=value&&typeof value==='object'?value:{};
  return {
    version:VERSION,
    seenThroughAt:typeof source.seenThroughAt==='string'?source.seenThroughAt:'',
    seenAwardKey:typeof source.seenAwardKey==='string'?source.seenAwardKey:''
  };
}

function timestamp(value){
  const ms=Date.parse(value||'');
  return Number.isFinite(ms)?ms:0;
}

export function createRewardCollectionViewState({learnerId,storage=globalThis?.localStorage,keyPrefix='FamilyLearning.RewardCollectionView'}={}){
  if(!learnerId||typeof learnerId!=='string')throw new TypeError('learnerId is required');
  const store=safeStorage(storage),key=`${keyPrefix}.${learnerId}`;

  function read(){
    try{return normalize(JSON.parse(store.getItem(key)||'{}'));}
    catch{return normalize({});}
  }
  function write(next){
    const value=normalize(next);
    try{store.setItem(key,JSON.stringify(value));}catch{}
    return value;
  }
  function isNew(unlock){
    if(!unlock||typeof unlock!=='object')return false;
    const state=read(),unlockAt=timestamp(unlock.at),seenAt=timestamp(state.seenThroughAt);
    if(unlockAt&&seenAt)return unlockAt>seenAt;
    if(unlockAt&&!seenAt)return true;
    return Boolean(unlock.awardKey)&&unlock.awardKey!==state.seenAwardKey;
  }
  function markSeen(unlock){
    if(!unlock||typeof unlock!=='object')return read();
    const current=read(),unlockAt=timestamp(unlock.at),seenAt=timestamp(current.seenThroughAt);
    if(unlockAt&&seenAt&&unlockAt<seenAt)return current;
    return write({seenThroughAt:unlock.at||current.seenThroughAt,seenAwardKey:unlock.awardKey||current.seenAwardKey});
  }
  function reset(){return write({});}

  return Object.freeze({read,isNew,markSeen,reset,key});
}
