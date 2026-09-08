export function summarizeMashaalProgress(state){
  const skills=Object.values(state?.skills||{});
  return skills.reduce((summary,skill)=>{
    const status=skill?.status||'not-started';
    summary[status]=(summary[status]||0)+1;
    return summary;
  },{'not-started':0,developing:0,mastered:0});
}
