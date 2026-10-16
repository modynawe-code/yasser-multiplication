export function createActivityDefinition({id,type,prompt='',options=[],metadata={}}={}){
  if(!id||!type)throw new TypeError('activity id and type are required');
  return Object.freeze({id:String(id),type:String(type),prompt:String(prompt),options:Object.freeze([...options]),metadata:Object.freeze({...metadata})});
}
