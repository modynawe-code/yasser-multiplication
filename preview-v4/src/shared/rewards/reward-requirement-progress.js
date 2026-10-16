function metricValue(metrics,metric){
  const value=metrics?.[metric];
  if(Array.isArray(value))return value.length;
  const number=Number(value);
  return Number.isFinite(number)&&number>0?number:0;
}

export function rewardRequirementProgress(reward,metrics={}){
  const definitions=Array.isArray(reward?.requirements?.criteria)?reward.requirements.criteria:[];
  const criteria=definitions.map(item=>{
    const target=Math.max(1,Number(item?.target)||1);
    const current=Math.min(target,Math.max(0,metricValue(metrics,item?.metric)));
    return Object.freeze({
      metric:String(item?.metric||''),
      label:String(item?.label||''),
      current,target,
      remaining:Math.max(0,target-current),
      complete:current>=target
    });
  });
  const complete=criteria.length>0&&criteria.every(item=>item.complete);
  const percent=criteria.length?Math.round(criteria.reduce((sum,item)=>sum+(item.current/item.target),0)/criteria.length*100):0;
  return Object.freeze({criteria:Object.freeze(criteria),complete,percent});
}

export function rewardRequirementsMet(reward,metrics={}){
  return rewardRequirementProgress(reward,metrics).complete;
}
