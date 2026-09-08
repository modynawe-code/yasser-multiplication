const SYMBOLS=Object.freeze({
  star:'⭐',ball:'⚽',apple:'🍎',circle:'●',square:'■',box:'▣',
  'red-circle':'🔴','blue-circle':'🔵','red-star':'⭐','yellow-star':'🌟'
});

const tokenLabel=(token)=>({
  left:'المجموعة الأولى',right:'المجموعة الثانية',
  'star-then-ball':'⭐ ثم ⚽','ball-then-star':'⚽ ثم ⭐','star-only':'⭐ فقط',
  circle:'●',star:'⭐',square:'■',
  'ball-above-box':'⚽ فوق الصندوق','ball-inside-box':'⚽ داخل الصندوق','ball-below-box':'⚽ تحت الصندوق'
}[token]||SYMBOLS[token]||String(token));

function stimulusModel(stimulus={}){
  switch(stimulus.kind){
    case 'ordered-actions':return {kind:'sequence',items:(stimulus.actions||[]).map(tokenLabel)};
    case 'initial-sound':return {kind:'sound',text:`/${stimulus.sound||''}/`};
    case 'letter-sound':return {kind:'sound',text:`/${stimulus.sound||''}/`};
    case 'countable-set':return {kind:'items',items:Array.from({length:stimulus.count||0},()=>SYMBOLS[stimulus.item]||'●')};
    case 'group-comparison':return {kind:'groups',groups:[Array.from({length:stimulus.leftCount||0},()=> '●'),Array.from({length:stimulus.rightCount||0},()=> '●')]};
    case 'attribute-sort':return {kind:'items',items:[]};
    case 'pattern':return {kind:'sequence',items:(stimulus.sequence||[]).map(tokenLabel)};
    case 'spatial-relation':return {kind:'relation',text:stimulus.relation==='above'?'⚽\n▣':`${stimulus.subject||''} ${stimulus.relation||''} ${stimulus.reference||''}`};
    default:return {kind:'text',text:''};
  }
}

export function createMashaalActivityViewModel(activity){
  if(!activity)return null;
  return Object.freeze({
    id:activity.id,
    skillId:activity.skillId,
    interaction:activity.interaction,
    promptAr:activity.promptAr,
    audioPromptAr:activity.audioPromptAr,
    stimulus:Object.freeze(stimulusModel(activity.stimulus)),
    choices:Object.freeze((activity.choices||[]).map(value=>Object.freeze({value,label:tokenLabel(value)}))),
    multiSelect:activity.interaction==='sorting',
    correctValues:Object.freeze(activity.interaction==='sorting'?String(activity.correctChoice||'').split('|').filter(Boolean):[String(activity.correctChoice||'')])
  });
}

export function isMashaalActivityAnswerCorrect(viewModel,answer){
  if(!viewModel)return false;
  const expected=[...viewModel.correctValues].sort();
  const received=(Array.isArray(answer)?answer:[answer]).map(String).sort();
  return expected.length===received.length&&expected.every((value,index)=>value===received[index]);
}
