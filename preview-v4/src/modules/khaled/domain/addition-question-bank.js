function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueOptions(correct,min,max,random=Math.random){
  const values=new Set([correct]);
  while(values.size<3)values.add(randomNumber(min,max,random));
  return shuffle([...values],random);
}

export function createAdditionSentenceQuestion({maxTotal=10,random=Math.random}={}){
  const left=randomNumber(1,5,random);
  const right=randomNumber(1,Math.max(1,maxTotal-left),random);
  const correctAnswer=left+right;
  return{
    id:`addition-sentence-${left}-${right}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'addition-sentence',
    prompt:'وش ناتج جملة الجمع؟',
    spokenPrompt:`احسب ${left} زائد ${right}.`,
    left,right,
    options:uniqueOptions(correctAnswer,1,maxTotal,random),
    correctAnswer
  };
}

export function createZeroAdditionQuestion({max=10,random=Math.random}={}){
  const value=randomNumber(0,max,random);
  const zeroFirst=random()>=.5;
  const left=zeroFirst?0:value;
  const right=zeroFirst?value:0;
  return{
    id:`zero-addition-${left}-${right}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'zero-addition',
    prompt:'إذا جمعنا مع صفر، كم يصير؟',
    spokenPrompt:`احسب ${left} زائد ${right}. تذكر أن الصفر لا يغير العدد.`,
    left,right,
    options:uniqueOptions(value,0,max,random),
    correctAnswer:value
  };
}

export function createNumberBondQuestion({minTotal=4,maxTotal=12,random=Math.random}={}){
  const total=randomNumber(minTotal,maxTotal,random);
  const known=randomNumber(1,total-1,random);
  const correctAnswer=total-known;
  return{
    id:`number-bond-${total}-${known}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'number-bond',
    prompt:'وش الجزء الناقص؟',
    spokenPrompt:`نكوّن العدد ${total}. عندنا جزء قيمته ${known}. كم الجزء الناقص؟`,
    total,known,
    options:uniqueOptions(correctAnswer,1,total-1,random),
    correctAnswer
  };
}

export function createVerticalAdditionQuestion({maxTotal=12,random=Math.random}={}){
  const left=randomNumber(1,Math.min(9,maxTotal-1),random);
  const right=randomNumber(1,Math.max(1,maxTotal-left),random);
  const correctAnswer=left+right;
  return{
    id:`vertical-addition-${left}-${right}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'vertical-addition',
    prompt:'اجمع بشكل رأسي',
    spokenPrompt:`اجمع ${left} و ${right}.`,
    left,right,
    options:uniqueOptions(correctAnswer,2,maxTotal,random),
    correctAnswer
  };
}

export function createAdditionStoryQuestion({maxTotal=10,random=Math.random}={}){
  const left=randomNumber(1,5,random);
  const right=randomNumber(1,Math.max(1,maxTotal-left),random);
  const correctAnswer=left+right;
  return{
    id:`addition-story-${left}-${right}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'visual-addition',
    prompt:'كم صار عندنا كلها؟',
    spokenPrompt:`كان عندنا ${left} أشياء، وجاءت ${right} أشياء أخرى. كم صار عندنا كلها؟`,
    left,right,
    options:uniqueOptions(correctAnswer,2,maxTotal,random),
    correctAnswer
  };
}

export function createAdditionRoundQuestion(index,{random=Math.random}={}){
  switch(index%5){
    case 0:return createAdditionStoryQuestion({maxTotal:10,random});
    case 1:return createAdditionSentenceQuestion({maxTotal:10,random});
    case 2:return createZeroAdditionQuestion({max:10,random});
    case 3:return createNumberBondQuestion({minTotal:4,maxTotal:12,random});
    default:return createVerticalAdditionQuestion({maxTotal:12,random});
  }
}
