export function getMashaalActivityLayout(viewModel){
  if(!viewModel)return Object.freeze({mode:'choice',choiceCount:0,hideStimulus:false});
  const choiceCount=viewModel.choices?.length||0;
  let mode='choice';
  if(viewModel.requiresHumanRecitation)mode='recitation';
  else if(viewModel.completionOnly)mode='guided';
  else if(viewModel.orderedSequence)mode='sequence';
  else if(viewModel.multiSelect)mode='multi-select';
  else if(viewModel.stimulus?.kind==='groups')mode='comparison';
  const hideStimulus=Boolean(viewModel.orderedSequence||viewModel.stimulus?.kind==='groups');
  return Object.freeze({mode,choiceCount,hideStimulus});
}
