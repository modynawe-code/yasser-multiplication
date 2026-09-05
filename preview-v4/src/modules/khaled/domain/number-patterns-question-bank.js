function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}

function missingSequence({start,step,length=4,missingIndex=2}){
  const values=Array.from({length},(_,index)=>start+(index*step));
  const correctAnswer=values[missingIndex];
  return{values:values.map((value,index)=>index===missingIndex?null:value),correctAnswer};
}

export function createCountByTensQuestion({random=Math.random}={}){
  const start=randomNumber(0,6,random)*10;
  const missingIndex=randomNumber(1,3,random);
  const {values,correctAnswer}=missingSequence({start,step:10,length:4,missingIndex});
  return{id:`tens-${start}-${missingIndex}-${Math.round(random()*1e7)}`,skillId:'number-patterns',type:'count-by-tens',prompt:'وش العدد الناقص؟',spokenPrompt:'عد بالعشرات، ثم اختر العدد الناقص.',step:10,values,options:uniqueOptions(correctAnswer,0,100,random),correctAnswer};
}

export function createFindNumberPatternQuestion({random=Math.random}={}){
  const steps=[1,2,5,10],step=steps[randomNumber(0,steps.length-1,random)];
  const maxStart=Math.max(0,100-step*3);
  const start=randomNumber(0,maxStart,random);
  const missingIndex=randomNumber(1,3,random);
  const {values,correctAnswer}=missingSequence({start,step,length:4,missingIndex});
  return{id:`find-pattern-${start}-${step}-${missingIndex}-${Math.round(random()*1e7)}`,skillId:'number-patterns',type:'find-number-pattern',prompt:'اكتشف النمط واختر العدد الناقص',spokenPrompt:'انظر إلى الأعداد، اكتشف النمط، ثم اختر العدد الناقص.',step,values,options:uniqueOptions(correctAnswer,0,100,random),correctAnswer};
}

export function createHundredChartQuestion({random=Math.random}={}){
  const askBelow=random()>=.5;
  let number;
  if(askBelow)number=randomNumber(1,90,random);
  else{number=randomNumber(1,99,random);if(number%10===0)number-=1;}
  const correctAnswer=askBelow?number+10:number+1;
  return{id:`hundred-chart-${number}-${askBelow?'below':'next'}-${Math.round(random()*1e7)}`,skillId:'number-patterns',type:'hundred-chart',prompt:askBelow?'وش العدد اللي تحت؟':'وش العدد اللي بعده؟',spokenPrompt:askBelow?`في لوحة المئة، ما العدد الذي يقع تحت ${number}؟`:`في لوحة المئة، ما العدد الذي يأتي بعد ${number}؟`,number,direction:askBelow?'below':'next',options:uniqueOptions(correctAnswer,1,100,random),correctAnswer};
}

export function createSkipCountQuestion({random=Math.random}={}){
  const steps=[2,5,10],step=steps[randomNumber(0,steps.length-1,random)];
  const maxStart=Math.max(0,100-step*4);
  const start=randomNumber(0,maxStart,random);
  const missingIndex=randomNumber(1,4,random);
  const {values,correctAnswer}=missingSequence({start,step,length:5,missingIndex});
  return{id:`skip-${step}-${start}-${missingIndex}-${Math.round(random()*1e7)}`,skillId:'number-patterns',type:'skip-count',prompt:`عد بالقفز ${step}، وش العدد الناقص؟`,spokenPrompt:`عد بالقفز بمقدار ${step}، ثم اختر العدد الناقص.`,step,values,options:uniqueOptions(correctAnswer,0,100,random),correctAnswer};
}

export function createNumberPatternsRoundQuestion(index,{random=Math.random}={}){
  switch(index%4){
    case 0:return createCountByTensQuestion({random});
    case 1:return createFindNumberPatternQuestion({random});
    case 2:return createHundredChartQuestion({random});
    default:return createSkipCountQuestion({random});
  }
}
