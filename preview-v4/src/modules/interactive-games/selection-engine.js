export function normalizeParticipants(values=[]){
  const seen=new Set();
  return values.map(value=>String(value||'').trim()).filter(value=>{
    const key=value.toLocaleLowerCase('ar');
    if(!value||seen.has(key))return false;
    seen.add(key);return true;
  });
}

export function drawParticipant(participants,{remaining=null,noRepeat=true,random=Math.random}={}){
  const result=drawParticipants(participants,{remaining,noRepeat,count:1,random});
  return{participant:result.participants[0]||null,remaining:result.remaining,cycleRestarted:result.cycleRestarted};
}

export function drawParticipants(participants,{remaining=null,noRepeat=true,count=1,random=Math.random}={}){
  const roster=normalizeParticipants(participants);
  if(!roster.length)return{participants:[],remaining:[],cycleRestarted:false};
  const requested=Math.min(roster.length,Math.max(1,Math.floor(Number(count)||1)));
  let pool=noRepeat&&Array.isArray(remaining)?roster.filter(name=>remaining.includes(name)):roster;
  let cycleRestarted=false;
  if(pool.length<requested){pool=roster;cycleRestarted=true;}
  const drawPool=[...pool],selected=[];
  while(selected.length<requested&&drawPool.length){
    const value=Number(random());
    const index=Math.min(drawPool.length-1,Math.max(0,Math.floor((Number.isFinite(value)?value:0)*drawPool.length)));
    selected.push(drawPool.splice(index,1)[0]);
  }
  const nextRemaining=noRepeat?drawPool:roster;
  return{participants:selected,remaining:nextRemaining,cycleRestarted};
}
