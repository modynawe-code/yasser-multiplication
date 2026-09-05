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

export function createCountQuestion({max=5,random=Math.random}={}){
  const count=Math.floor(random()*(max+1));
  return{
    id:`count-${max}-${count}-${Math.round(random()*1e7)}`,
    skillId:max<=5?'numbers-0-5':'numbers-6-10',
    type:'count-select',
    prompt:'كم دائرة تشوف؟',
    spokenPrompt:'عد الدوائر، ثم اختر العدد الصحيح.',
    count,
    options:uniqueOptions(count,0,max,random),
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

export function createKhaledRound({skillId,count=8,random=Math.random}={}){
  const questions=[];
  for(let i=0;i<count;i++){
    if(skillId==='numbers-0-5')questions.push(createCountQuestion({max:5,random}));
    else if(skillId==='classify-compare')questions.push(createCompareQuestion({max:5,random}));
    else throw new Error(`Unsupported Khaled skill: ${skillId}`);
  }
  return questions;
}
