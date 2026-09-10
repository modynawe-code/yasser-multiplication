export function getMashaalActivityLayout(viewModel){
  if(!viewModel)return Object.freeze({mode:'choice',choiceCount:0,hideStimulus:false});
  const choiceCount=viewModel.choices?.length||0;
  const stimulusKind=viewModel.stimulus?.kind||'text';
  let mode='choice';
  if(viewModel.requiresHumanRecitation)mode='recitation';
  else if(viewModel.completionOnly){
    if(stimulusKind==='emotion-prompt')mode='guided-emotion';
    else if(stimulusKind==='movement')mode='guided-movement';
    else if(stimulusKind==='fine-motor')mode='guided-fine-motor';
    else mode='guided';
  }else if(viewModel.orderedSequence)mode='sequence';
  else if(viewModel.multiSelect)mode='multi-select';
  else if(stimulusKind==='groups')mode='comparison';
  else if(stimulusKind==='items')mode='counting';
  const hidesAnswerReveal=stimulusKind==='relation'||(stimulusKind==='picture'&&viewModel.stimulus?.scene==='two-children-one-ball');
  const hideStimulus=Boolean(viewModel.orderedSequence||stimulusKind==='groups'||hidesAnswerReveal);
  return Object.freeze({mode,choiceCount,hideStimulus});
}
