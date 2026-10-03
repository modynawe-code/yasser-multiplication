export function deriveMashaalDevelopmentalStatus({evidenceCount=0,recentSuccesses=0,transferObserved=false}={}){
  if(evidenceCount<=0)return 'not-started';
  if(evidenceCount>=3&&recentSuccesses>=2&&transferObserved===true)return 'mastered';
  return 'developing';
}
