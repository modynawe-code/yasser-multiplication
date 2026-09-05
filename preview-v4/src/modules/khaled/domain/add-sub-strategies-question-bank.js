function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueNumberOptions(correct,min,max,random=Math.random){
  const values=new Set([correct]);
  while(values.size<3)values.add(randomNumber(min,max,random));
  return shuffle([...values],random);
}

export function createCountOnAdditionQuestion({max=12,random=Math.random}={}){
  const steps=randomNumber(1,3,random);
  const start=randomNumber(0,max-steps,random);
  const correctAnswer=start+steps;
  return{
    id:`count-on-${start}-${steps}-${Math.round(random()*1e7)}`,
    skillId:'add-sub-strategies',
    type:'count-on-addition',
    prompt:'عد للأمام، وين توصل؟',
    spokenPrompt:`ابدأ من ${start}. عد ${steps} خطوات إلى الأمام. إلى أي عدد تصل؟`,
    start,steps,direction:'forward',
    options:uniqueNumberOptions(correctAnswer,0,max,random),
    correctAnswer
  };
}

export function createNumberLineAdditionQuestion({max=12,random=Math.random}={}){
  const steps=randomNumber(1,4,random);
  const start=randomNumber(0,max-steps,random);
  const correctAnswer=start+steps;
  return{
    id:`number-line-add-${start}-${steps}-${Math.round(random()*1e7)}`,
    skillId:'add-sub-strategies',
    type:'number-line-addition',
    prompt:'تحرك على خط الأعداد، وين توقف؟',
    spokenPrompt:`ابدأ من ${start} وتحرك ${steps} خطوات إلى اليمين على خط الأعداد.`,
    start,steps,direction:'forward',max,
    options:uniqueNumberOptions(correctAnswer,0,max,random),
    correctAnswer
  };
}

export function createCountBackSubtractionQuestion({max=12,random=Math.random}={}){
  const start=randomNumber(2,max,random);
  const steps=randomNumber(1,Math.min(3,start),random);
  const correctAnswer=start-steps;
  return{
    id:`count-back-${start}-${steps}-${Math.round(random()*1e7)}`,
    skillId:'add-sub-strategies',
    type:'count-back-subtraction',
    prompt:'عد للخلف، وين توصل؟',
    spokenPrompt:`ابدأ من ${start}. عد ${steps} خطوات إلى الخلف. إلى أي عدد تصل؟`,
    start,steps,direction:'backward',
    options:uniqueNumberOptions(correctAnswer,0,max,random),
    correctAnswer
  };
}

export function createNumberSentenceQuestion({max=12,random=Math.random}={}){
  const addition=random()>=.5;
  if(addition){
    const left=randomNumber(1,6,random);
    const right=randomNumber(1,Math.max(1,max-left),random);
    const total=left+right;
    const correctAnswer=`${left}+${right}=${total}`;
    const distractors=[`${left}+${right}=${Math.max(0,total-1)}`,`${left}+${right}=${Math.min(max,total+1)}`];
    return{
      id:`number-sentence-add-${left}-${right}-${Math.round(random()*1e7)}`,
      skillId:'add-sub-strategies',
      type:'number-sentence',
      operation:'addition',
      prompt:'أي جملة عددية صحيحة؟',
      spokenPrompt:`اختر الجملة العددية الصحيحة لـ ${left} زائد ${right}.`,
      left,right,total,
      options:shuffle([correctAnswer,...distractors],random),
      correctAnswer
    };
  }

  const start=randomNumber(2,max,random);
  const removed=randomNumber(1,start,random);
  const left=start-removed;
  const correctAnswer=`${start}-${removed}=${left}`;
  const distractors=[`${start}-${removed}=${Math.min(max,left+1)}`,`${start}-${removed}=${Math.max(0,left-1)}`];
  return{
    id:`number-sentence-sub-${start}-${removed}-${Math.round(random()*1e7)}`,
    skillId:'add-sub-strategies',
    type:'number-sentence',
    operation:'subtraction',
    prompt:'أي جملة عددية صحيحة؟',
    spokenPrompt:`اختر الجملة العددية الصحيحة لـ ${start} ناقص ${removed}.`,
    start,removed,total:left,
    options:shuffle([correctAnswer,...distractors],random),
    correctAnswer
  };
}

export function createNumberLineSubtractionQuestion({max=12,random=Math.random}={}){
  const start=randomNumber(2,max,random);
  const steps=randomNumber(1,Math.min(4,start),random);
  const correctAnswer=start-steps;
  return{
    id:`number-line-sub-${start}-${steps}-${Math.round(random()*1e7)}`,
    skillId:'add-sub-strategies',
    type:'number-line-subtraction',
    prompt:'ارجع على خط الأعداد، وين توقف؟',
    spokenPrompt:`ابدأ من ${start} وارجع ${steps} خطوات إلى اليسار على خط الأعداد.`,
    start,steps,direction:'backward',max,
    options:uniqueNumberOptions(correctAnswer,0,max,random),
    correctAnswer
  };
}

export function createStrategiesRoundQuestion(index,{random=Math.random}={}){
  switch(index%5){
    case 0:return createCountOnAdditionQuestion({max:12,random});
    case 1:return createNumberLineAdditionQuestion({max:12,random});
    case 2:return createCountBackSubtractionQuestion({max:12,random});
    case 3:return createNumberSentenceQuestion({max:12,random});
    default:return createNumberLineSubtractionQuestion({max:12,random});
  }
}
