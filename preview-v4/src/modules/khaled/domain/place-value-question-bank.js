function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueOptions(correct,min,max,random=Math.random){
  const values=new Set([correct]);
  while(values.size<3)values.add(randomNumber(min,max,random));
  return shuffle([...values],random);
}
function placeParts(number){return{tens:Math.floor(number/10),ones:number%10};}

export function createPlaceValueModelQuestion({random=Math.random}={}){
  const number=randomNumber(10,99,random);
  const {tens,ones}=placeParts(number);
  return{id:`place-model-${number}-${Math.round(random()*1e7)}`,skillId:'place-value',type:'place-value-model',prompt:'كم العدد الذي تمثله العشرات والآحاد؟',spokenPrompt:`عد العشرات والآحاد، ثم اختر العدد الصحيح.`,number,tens,ones,options:uniqueOptions(number,10,99,random),correctAnswer:number};
}

export function createGuessCheckPlaceValueQuestion({random=Math.random}={}){
  const number=randomNumber(10,99,random);
  const {tens,ones}=placeParts(number);
  return{id:`place-clue-${number}-${Math.round(random()*1e7)}`,skillId:'place-value',type:'place-value-clue',prompt:'أي عدد يطابق هذه الخانات؟',spokenPrompt:`عندي ${tens} عشرات و ${ones} آحاد. ما العدد؟`,number,tens,ones,options:uniqueOptions(number,10,99,random),correctAnswer:number};
}

export function createRangeRecognitionQuestion({max=50,random=Math.random}={}){
  const min=max===50?21:51;
  const correctAnswer=randomNumber(min,max,random);
  return{id:`place-range-${max}-${correctAnswer}-${Math.round(random()*1e7)}`,skillId:'place-value',type:max===50?'number-to-50':'number-to-100',prompt:'اسمع واختر العدد الصحيح',spokenPrompt:`اختر العدد ${correctAnswer}.`,rangeMax:max,options:uniqueOptions(correctAnswer,min,max,random),correctAnswer};
}

export function createEstimateQuestion({random=Math.random}={}){
  const exact=randomNumber(12,94,random);
  const lower=Math.floor(exact/10)*10;
  const upper=Math.min(100,lower+10);
  const correctAnswer=exact-lower<upper-exact?lower:upper;
  const third=correctAnswer===lower?Math.min(100,upper+10):Math.max(0,lower-10);
  const options=shuffle([...new Set([correctAnswer,correctAnswer===lower?upper:lower,third])],random);
  return{id:`estimate-${exact}-${Math.round(random()*1e7)}`,skillId:'place-value',type:'estimate-nearest-ten',prompt:'أي تقدير أقرب للعدد؟',spokenPrompt:`العدد هو ${exact}. اختر العشرة الأقرب إليه.`,exact,options,correctAnswer};
}

export function createCompareTo100Question({random=Math.random}={}){
  let left=randomNumber(0,100,random),right=randomNumber(0,100,random);
  if(left===right)right=right===100?99:right+1;
  const askLarger=random()>=.5;
  const correctAnswer=askLarger?Math.max(left,right):Math.min(left,right);
  return{id:`compare-100-${left}-${right}-${askLarger?'larger':'smaller'}-${Math.round(random()*1e7)}`,skillId:'place-value',type:'compare-to-100',prompt:askLarger?'أي عدد أكبر؟':'أي عدد أصغر؟',spokenPrompt:askLarger?'اختر العدد الأكبر.':'اختر العدد الأصغر.',left,right,options:[left,right],correctAnswer};
}

function orderText(values){return values.join(' < ');}
export function createOrderTo100Question({random=Math.random}={}){
  const values=new Set();
  while(values.size<3)values.add(randomNumber(0,100,random));
  const numbers=[...values];
  const sorted=[...numbers].sort((a,b)=>a-b);
  const correctAnswer=orderText(sorted);
  const reverse=orderText([...sorted].reverse());
  const swapped=orderText([sorted[0],sorted[2],sorted[1]]);
  return{id:`order-100-${numbers.join('-')}-${Math.round(random()*1e7)}`,skillId:'place-value',type:'order-to-100',prompt:'أي ترتيب من الأصغر إلى الأكبر؟',spokenPrompt:'اختر ترتيب الأعداد من الأصغر إلى الأكبر.',numbers,options:shuffle([correctAnswer,reverse,swapped],random),correctAnswer};
}

export function createPlaceValueRoundQuestion(index,{random=Math.random}={}){
  switch(index%7){
    case 0:return createPlaceValueModelQuestion({random});
    case 1:return createGuessCheckPlaceValueQuestion({random});
    case 2:return createRangeRecognitionQuestion({max:50,random});
    case 3:return createRangeRecognitionQuestion({max:100,random});
    case 4:return createEstimateQuestion({random});
    case 5:return createCompareTo100Question({random});
    default:return createOrderTo100Question({random});
  }
}
