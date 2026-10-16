const ID_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeReward(definition){
  if(!definition||typeof definition!=='object')throw new TypeError('reward definition is required');
  const id=String(definition.id||'').trim();
  const label=String(definition.label||'').trim();
  const graphicKey=String(definition.graphicKey||id).trim();
  if(!ID_PATTERN.test(id))throw new TypeError(`invalid reward id: ${id}`);
  if(!label)throw new TypeError('reward label is required');
  if(!graphicKey)throw new TypeError('reward graphicKey is required');
  return Object.freeze({...definition,id,label,graphicKey});
}

export function createRewardCatalogRegistry(initialCatalogs=[]){
  const catalogs=new Map();
  const rewards=new Map();
  const rewardCatalogIds=new Map();

  function register(catalogId,definitions=[]){
    const id=String(catalogId||'').trim();
    if(!ID_PATTERN.test(id))throw new TypeError(`invalid reward catalog id: ${id}`);
    if(catalogs.has(id))throw new Error(`reward catalog already registered: ${id}`);
    if(!Array.isArray(definitions)||!definitions.length)throw new TypeError('reward catalog must contain rewards');
    const normalized=definitions.map(normalizeReward);
    const localIds=new Set();
    for(const reward of normalized){
      if(localIds.has(reward.id))throw new Error(`duplicate reward in catalog: ${reward.id}`);
      if(rewards.has(reward.id))throw new Error(`reward id already registered: ${reward.id}`);
      localIds.add(reward.id);
    }
    const catalog=Object.freeze({id,rewards:Object.freeze(normalized)});
    catalogs.set(id,catalog);
    for(const reward of normalized){
      rewards.set(reward.id,reward);
      rewardCatalogIds.set(reward.id,id);
    }
    return catalog;
  }

  function getCatalog(catalogId){return catalogs.get(String(catalogId||''))||null;}
  function getReward(rewardId){return rewards.get(String(rewardId||''))||null;}
  function getCatalogIdForReward(rewardId){return rewardCatalogIds.get(String(rewardId||''))||null;}
  function listCatalogs(){return Object.freeze([...catalogs.values()]);}

  for(const entry of initialCatalogs||[])register(entry.id,entry.rewards);
  return Object.freeze({register,getCatalog,getReward,getCatalogIdForReward,listCatalogs});
}
