function normalizeLearnerId(value){
  return String(value||'').trim().toLowerCase();
}

export function learnerScopedStoragePrefix(learnerId){
  const id=normalizeLearnerId(learnerId);
  if(!id)throw new TypeError('learner id is required');
  return `family-learning:${id}:`;
}

function storageKeys(storage){
  const keys=[];
  const length=Number(storage?.length);
  if(!Number.isInteger(length)||length<0||typeof storage?.key!=='function')return keys;
  for(let index=0;index<length;index+=1){
    try{
      const key=storage.key(index);
      if(key!==null&&key!==undefined)keys.push(String(key));
    }catch{}
  }
  return keys;
}

export function resetLearnerScopedProgress(storage,learnerId){
  const prefix=learnerScopedStoragePrefix(learnerId);
  const removed=[];
  for(const key of storageKeys(storage)){
    if(!key.startsWith(prefix))continue;
    try{
      storage?.removeItem?.(key);
      removed.push(key);
    }catch{}
  }
  return Object.freeze(removed);
}
