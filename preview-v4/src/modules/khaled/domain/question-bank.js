function shuffle(values,random=Math.random){
  return [...values].sort(()=>random()-.5);
}

function uniqueOptions(correct,min,max,random=Math.random){
  const values=new Set([correct]);
  while(values.size<3){
    const candidate=Math.floor(random()*(max-min+1))+min;
    values.add(candidate);
  }
  return shuffle([...values],random);
}

function numberSkillId(max){
  if(max<=5)return 'numbers-0-5';
  if(max<=10)return 'numbers-6-10';
  return 'numbers-11-20';
}

export function createCountQuestion({min=0,max=5,random=Math.random}={}){
  const count=Math.floor(random()*(max-min+1))+min;
  return{
    id:`count-${min}-${max}-${count}-${Math.round(random()*1e7)}`,
    skillId:numberSkillId(max),
    type:'count-select',
    prompt:'كم دائرة تشوف؟',
    spokenPrompt:'عد الدوائر، ثم اختر العدد الصحيح.',
    count,
    options:uniqueOptions(count,min,max,random),
    correctAnswer:count
  };
}

export function createCompareQuestion({max=5,random=Math.random}={}){
  let left=Math.floor(random()*max)+1;
  let right=Math.floor(random()*max)+1;
  if(left===right)right=right===max?right-1:right+1;
  const askMore=random()>=.5;
  const correctSide=askMore?(left>right?'left':'right'):(left<right?'left':'right');
  return{
    id:`compare-${left}-${right}-${askMore?'more':'less'}-${Math.round(random()*1e7)}`,
    skillId:'classify-compare',
    type:'compare-groups',
    prompt:askMore?'أي مجموعة فيها أكثر؟':'أي مجموعة فيها أقل؟',
    spokenPrompt:askMore?'اختر المجموعة التي فيها دوائر أكثر.':'اختر المجموعة التي فيها دوائر أقل.',
    left,
    right,
    correctAnswer:correctSide
  };
}

const POSITION_SHAPES=Object.freeze(['★','●','▲']);

export function createPositionQuestion({random=Math.random}={}){
  const variant=Math.floor(random()*3);
  if(variant===0){
    const askTop=random()>=.5;
    return{
      id:`position-above-${Math.round(random()*1e7)}`,
      skillId:'position-pattern',
      type:'position-select',
      layout:'vertical-two',
      prompt:askTop?'وش الشكل اللي فوق؟':'وش الشكل اللي تحت؟',
      spokenPrompt:askTop?'اختر الشكل الموجود فوق.':'اختر الشكل الموجود تحت.',
      items:['★','●'],
      options:['★','●'],
      correctAnswer:askTop?'★':'●'
    };
  }
  if(variant===1){
    const targetIndex=Math.floor(random()*3);
    const labels=['الأعلى','الأوسط','الأسفل'];
    return{
      id:`position-three-${targetIndex}-${Math.round(random()*1e7)}`,
      skillId:'position-pattern',
      type:'position-select',
      layout:'vertical-three',
      prompt:`وش الشكل ${labels[targetIndex]}؟`,
      spokenPrompt:`اختر الشكل ${labels[targetIndex]}.`,
      items:[...POSITION_SHAPES],
      options:[...POSITION_SHAPES],
      correctAnswer:POSITION_SHAPES[targetIndex]
    };
  }

  const askAfter=random()>=.5;
  return{
    id:`position-order-${askAfter?'after':'before'}-${Math.round(random()*1e7)}`,
    skillId:'position-pattern',
    type:'position-select',
    layout:'horizontal-sequence',
    prompt:askAfter?'أي شكل بعد الدائرة؟':'أي شكل قبل الدائرة؟',
    spokenPrompt:askAfter?'انظر إلى الترتيب، واختر الشكل الذي يأتي بعد الدائرة.':'انظر إلى الترتيب، واختر الشكل الذي يأتي قبل الدائرة.',
    items:['★','●','▲'],
    options:['★','▲'],
    correctAnswer:askAfter?'▲':'★'
  };
}

export function createPatternQuestion({random=Math.random}={}){
  const patterns=[
    {items:['●','▲','●','▲'],answer:'●',options:['●','▲','■']},
    {items:['★','★','●','★','★','●'],answer:'★',options:['★','●','▲']},
    {items:['■','●','■','●'],answer:'■',options:['■','●','★']}
  ];
  const selected=patterns[Math.floor(random()*patterns.length)];
  return{
    id:`pattern-next-${Math.round(random()*1e7)}`,
    skillId:'position-pattern',
    type:'pattern-next',
    prompt:'وش الشكل اللي يكمل النمط؟',
    spokenPrompt:'شوف النمط، ثم اختر الشكل الذي يكمله.',
    items:[...selected.items],
    options:shuffle(selected.options,random),
    correctAnswer:selected.answer
  };
}

export function createNumberOrderQuestion({min=11,max=20,random=Math.random}={}){
  const center=Math.floor(random()*(max-min-1))+min+1;
  const missingIndex=Math.floor(random()*3);
  const sequence=[center-1,center,center+1];
  const correctAnswer=sequence[missingIndex];
  const items=sequence.map((value,index)=>index===missingIndex?null:value);
  return{
    id:`number-order-${center}-${missingIndex}-${Math.round(random()*1e7)}`,
    skillId:'numbers-11-20',
    type:'number-order',
    prompt:'وش العدد الناقص؟',
    spokenPrompt:'انظر إلى ترتيب الأعداد، ثم اختر العدد الناقص.',
    items,
    options:uniqueOptions(correctAnswer,min,max,random),
    correctAnswer
  };
}

export function createVisualAdditionQuestion({maxTotal=10,random=Math.random}={}){
  const left=Math.floor(random()*5)+1;
  const maxRight=Math.max(1,maxTotal-left);
  const right=Math.floor(random()*maxRight)+1;
  const correctAnswer=left+right;
  return{
    id:`visual-add-${left}-${right}-${Math.round(random()*1e7)}`,
    skillId:'addition-foundations',
    type:'visual-addition',
    prompt:'كم صار المجموع؟',
    spokenPrompt:`عندنا ${left} دوائر، وأضفنا ${right} دوائر. كم صار المجموع؟`,
    left,
    right,
    options:uniqueOptions(correctAnswer,2,maxTotal,random),
    correctAnswer
  };
}

export function createKhaledRound({skillId,count=8,random=Math.random}={}){
  const questions=[];
  for(let i=0;i<count;i++){
    if(skillId==='numbers-0-5')questions.push(createCountQuestion({min:0,max:5,random}));
    else if(skillId==='numbers-6-10')questions.push(createCountQuestion({min:6,max:10,random}));
    else if(skillId==='numbers-11-20')questions.push(i%2===0?createCountQuestion({min:11,max:20,random}):createNumberOrderQuestion({min:11,max:20,random}));
    else if(skillId==='classify-compare')questions.push(createCompareQuestion({max:5,random}));
    else if(skillId==='position-pattern')questions.push(i%2===0?createPositionQuestion({random}):createPatternQuestion({random}));
    else if(skillId==='addition-foundations')questions.push(createVisualAdditionQuestion({maxTotal:10,random}));
    else throw new Error(`Unsupported Khaled skill: ${skillId}`);
  }
  return questions;
}
