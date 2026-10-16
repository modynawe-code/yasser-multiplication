export function pickNextMashaalActivity(plan,{lastType=null}={}){
  if(!plan?.activityTypes?.length)return null;
  return plan.activityTypes.find(type=>type!==lastType)||plan.activityTypes[0];
}
