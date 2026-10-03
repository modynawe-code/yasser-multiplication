function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}

function makeParts({maxStart=12,random=Math.random}={}){
  const start=randomNumber(2,maxStart,random);
  const removed=randomNumber(1,start,random);
  return{start,removed,left:start-removed};
}

export function createSubtractionStoryQuestion({maxStart=12,random=Math.random}={}){
  const {start,removed,left}=makeParts({maxStart,random});
  return{id:`subtract-story-${start}-${removed}-${Math.round(random()*1e7)}`,skillId:'subtraction-foundations',type:'visual-subtraction',prompt:'كم بقي؟',spokenPrompt:`كان عندنا ${start} أشياء. أخذنا منها ${removed}. كم بقي؟`,start,removed,options:uniqueOptions(left,0,start,random),correctAnswer:left};
}

export function createSubtractionSentenceQuestion({maxStart=12,random=Math.random}={}){
  const {start,removed,left}=makeParts({maxStart,random});
  return{id:`subtract-sentence-${start}-${removed}-${Math.round(random()*1e7)}`,skillId:'subtraction-foundations',type:'subtraction-sentence',prompt:'وش ناتج جملة الطرح؟',spokenPrompt:`احسب ${start} ناقص ${removed}.`,start,removed,options:uniqueOptions(left,0,start,random),correctAnswer:left};
}

export function createZeroWholeSubtractionQuestion({max=12,random=Math.random}={}){
  const value=randomNumber(1,max,random);
  const removeAll=random()>=.5;
  const removed=removeAll?value:0;
  const correctAnswer=value-removed;
  return{id:`subtract-zero-whole-${value}-${removed}-${Math.round(random()*1e7)}`,skillId:'subtraction-foundations',type:'zero-whole-subtraction',prompt:removeAll?'إذا طرحنا الكل، كم يبقى؟':'إذا طرحنا صفر، كم يبقى؟',spokenPrompt:`احسب ${value} ناقص ${removed}.`,start:value,removed,options:uniqueOptions(correctAnswer,0,max,random),correctAnswer};
}

export function createVerticalSubtractionQuestion({maxStart=12,random=Math.random}={}){
  const {start,removed,left}=makeParts({maxStart,random});
  return{id:`vertical-subtraction-${start}-${removed}-${Math.round(random()*1e7)}`,skillId:'subtraction-foundations',type:'vertical-subtraction',prompt:'اطرح بشكل رأسي',spokenPrompt:`اطرح ${removed} من ${start}.`,start,removed,options:uniqueOptions(left,0,start,random),correctAnswer:left};
}

export function createSubtractionRoundQuestion(index,{random=Math.random}={}){
  switch(index%4){
    case 0:return createSubtractionStoryQuestion({maxStart:12,random});
    case 1:return createSubtractionSentenceQuestion({maxStart:12,random});
    case 2:return createZeroWholeSubtractionQuestion({max:12,random});
    default:return createVerticalSubtractionQuestion({maxStart:12,random});
  }
}
