const SYMBOLS=Object.freeze({
  star:'⭐',ball:'⚽',heart:'❤️',door:'🚪',apple:'🍎',moon:'🌙',circle:'●',square:'■',box:'▣',
  'red-circle':'🔴','blue-circle':'🔵','red-square':'🟥','yellow-square':'🟨',
  wake:'🌅','brush-teeth':'🪥',breakfast:'🥣',umbrella:'☂️',sunglasses:'🕶️',done:'تم ✓'
});

const tokenLabel=(token)=>({
  left:'المجموعة الأولى',right:'المجموعة الثانية',
  circle:'●',star:'⭐',square:'■',
  'ball-above-box':'⚽\n▣','ball-inside-box':'▣ ⚽','ball-below-box':'▣\n⚽'
}[token]||SYMBOLS[token]||String(token));

function stimulusModel(stimulus={}){
  switch(stimulus.kind){
    case 'ordered-actions':return {kind:'instruction',text:'🔊'};
    case 'initial-sound':return {kind:'sound',text:`/${stimulus.sound||''}/`};
    case 'letter-sound':return {kind:'sound',text:`/${stimulus.sound||''}/`};
    case 'countable-set':return {kind:'items',items:Array.from({length:stimulus.count||0},()=>SYMBOLS[stimulus.item]||'●')};
    case 'group-comparison':return {kind:'groups',groups:[Array.from({length:stimulus.leftCount||0},()=> '●'),Array.from({length:stimulus.rightCount||0},()=> '●')]};
    case 'attribute-sort':return {kind:'instruction',text:'👆'};
    case 'pattern':return {kind:'sequence',items:(stimulus.sequence||[]).map(tokenLabel)};
    case 'spatial-relation':return {kind:'relation',text:stimulus.relation==='above'?'⚽\n▣':`${stimulus.subject||''} ${stimulus.relation||''} ${stimulus.reference||''}`};
    case 'picture-scene':return {kind:'picture',text:stimulus.scene==='girl-drinking-water'?'👧 💧':stimulus.scene==='rainy-day'?'🌧️ 👧':'🖼️'};
    case 'trace-path':return {kind:'trace',text:stimulus.path==='wave'?'● 〰️〰️〰️ ⭐':'● ─── ⭐'};
    default:return {kind:'text',text:''};
  }
}

export function createMashaalActivityViewModel(activity){
  if(!activity)return null;
  const orderedSequence=activity.stimulus?.kind==='ordered-actions';
  const multiSelect=activity.interaction==='sorting';
  const completionOnly=activity.evidenceType==='activity-completion';
  return Object.freeze({
    id:activity.id,
    skillId:activity.skillId,
    interaction:activity.interaction,
    evidenceType:activity.evidenceType,
    promptAr:activity.promptAr,
    audioPromptAr:activity.audioPromptAr,
    stimulus:Object.freeze(stimulusModel(activity.stimulus)),
    choices:Object.freeze((activity.choices||[]).map(value=>Object.freeze({value,label:tokenLabel(value)}))),
    multiSelect,
    orderedSequence,
    completionOnly,
    correctValues:Object.freeze(completionOnly?[]:orderedSequence?[...(activity.stimulus?.actions||[])]:multiSelect?String(activity.correctChoice||'').split('|').filter(Boolean):[String(activity.correctChoice||'')])
  });
}

export function isMashaalActivityAnswerCorrect(viewModel,answer){
  if(!viewModel||viewModel.completionOnly)return false;
  const expected=[...viewModel.correctValues];
  const received=(Array.isArray(answer)?answer:[answer]).map(String);
  if(viewModel.orderedSequence)return expected.length===received.length&&expected.every((value,index)=>value===received[index]);
  expected.sort();received.sort();
  return expected.length===received.length&&expected.every((value,index)=>value===received[index]);
}
