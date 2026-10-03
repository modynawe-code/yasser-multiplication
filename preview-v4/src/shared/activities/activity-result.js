export function createActivityResult({activityId,completed=false,success=null,responseMs=null}={}){
  if(!activityId)throw new TypeError('activity id is required');
  return Object.freeze({activityId:String(activityId),completed:Boolean(completed),success:success===null?null:Boolean(success),responseMs:Number.isFinite(Number(responseMs))?Math.max(0,Number(responseMs)):null});
}
