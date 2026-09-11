import { getActivityRendererContract } from '../../../shared/activities/activity-renderer-contracts.js';

export function getMashaalActivityLayout(viewModel){
  if(!viewModel)return Object.freeze({mode:'choice',choiceCount:0,hideStimulus:false});
  const choiceCount=viewModel.choices?.length||0;
  const contract=getActivityRendererContract(viewModel.activityType);
  if(!contract)return Object.freeze({mode:'choice',choiceCount,hideStimulus:false});
  return Object.freeze({mode:contract.mode,choiceCount,hideStimulus:contract.hideStimulus});
}
