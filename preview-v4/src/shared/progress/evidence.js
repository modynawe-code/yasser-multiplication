export function createLearningEvidence({evidenceId,learnerId,skillId,type,createdAt=new Date().toISOString(),payload=null}={}){
  if(!evidenceId||!learnerId||!skillId||!type)throw new TypeError('incomplete learning evidence');
  return Object.freeze({evidenceId:String(evidenceId),learnerId:String(learnerId),skillId:String(skillId),type:String(type),createdAt:String(createdAt),payload});
}
