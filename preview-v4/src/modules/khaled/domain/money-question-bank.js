function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function pick(values,random=Math.random){return values[randomNumber(0,values.length-1,random)];}
function uniqueNumberOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}
function total(values){return values.reduce((sum,value)=>sum+value,0);}

const INTRO_SETS=Object.freeze([
  Object.freeze([1]),
  Object.freeze([1,1]),
  Object.freeze([5]),
  Object.freeze([10])
]);

export function createMoneyRecognitionQuestion({random=Math.random}={}){
  const coins=[...pick(INTRO_SETS,random)],correctAnswer=total(coins);
  return{id:`money-recognition-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-recognition',prompt:'كم قيمة النقود؟',spokenPrompt:`انظر إلى النقود. كم ريالًا تمثل؟`,coins,options:shuffle([1,2,5,10],random),correctAnswer};
}

export function createCountMoneyQuestion({random=Math.random}={}){
  const pools=[[1,1,1],[5,1,1],[5,5,1],[10,5,1],[10,5,5],[10,10,5]];
  const coins=[...pick(pools,random)],correctAnswer=total(coins);
  return{id:`count-money-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'count-money',prompt:'عد النقود، كم المجموع؟',spokenPrompt:'عد قيم النقود، ثم اختر المبلغ الكلي.',coins,options:uniqueNumberOptions(correctAnswer,1,30,random),correctAnswer};
}

export function createMoneyModelQuestion({random=Math.random}={}){
  const targets=[2,6,7,10,11,12,15,16,20],target=pick(targets,random);
  const valid=[];
  for(let tens=0;tens<=2;tens++)for(let fives=0;fives<=3;fives++)for(let ones=0;ones<=4;ones++){
    const coins=[...Array(tens).fill(10),...Array(fives).fill(5),...Array(ones).fill(1)];
    if(coins.length&&total(coins)===target)valid.push(coins);
  }
  const correctCoins=pick(valid,random);
  const wrongA=[10,1],wrongB=[5,1,1];
  const options=[
    {value:`correct-${correctCoins.join('-')}`,coins:correctCoins},
    {value:`wrong-a-${wrongA.join('-')}`,coins:wrongA},
    {value:`wrong-b-${wrongB.join('-')}`,coins:wrongB}
  ];
  const correctAnswer=options[0].value;
  return{id:`money-model-${target}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-model',prompt:`أي نقود تمثل ${target} ريال؟`,spokenPrompt:`اختر مجموعة النقود التي تساوي ${target} ريالًا.`,target,options:shuffle(options,random),correctAnswer};
}

export function createEqualAmountsQuestion({random=Math.random}={}){
  const target=pick([2,5,10,15,20],random);
  const left=target===2?[1,1]:target===5?[5]:target===10?[10]:target===15?[10,5]:[10,10];
  const equal=random()>=.5;
  let right;
  if(equal){right=target===2?[1,1]:target===5?[1,1,1,1,1]:target===10?[5,5]:target===15?[5,5,5]:[10,5,5];}
  else{const other=target===20?15:target+1;right=other===3?[1,1,1]:other===6?[5,1]:other===11?[10,1]:other===16?[10,5,1]:[10,5];}
  return{id:`money-equal-${target}-${equal?'yes':'no'}-${Math.round(random()*1e7)}`,skillId:'money',type:'equal-money-amounts',prompt:'هل المبلغان متساويان؟',spokenPrompt:'عد النقود في الجهتين. هل المبلغان متساويان؟',left,right,options:[{value:'yes',label:'نعم ✓'},{value:'no',label:'لا ✕'}],correctAnswer:equal?'yes':'no'};
}

export function createUseMoneyQuestion({random=Math.random}={}){
  const prices=[3,6,8,10,12,15],price=pick(prices,random);
  const wallets=[
    [1,1,1],
    [5,1],
    [5,1,1,1],
    [10],
    [10,1,1],
    [10,5]
  ];
  const correctCoins=[...wallets[prices.indexOf(price)]],correctValue=`buy-${correctCoins.join('-')}`;
  const wrongOptions=wallets.filter((_,index)=>index!==prices.indexOf(price)).filter(coins=>total(coins)!==price).slice(0,2).map((coins,index)=>({value:`wrong-${index}-${coins.join('-')}`,coins:[...coins]}));
  const options=shuffle([{value:correctValue,coins:correctCoins},...wrongOptions],random);
  return{id:`use-money-${price}-${Math.round(random()*1e7)}`,skillId:'money',type:'use-money',prompt:`السعر ${price} ريال، أي نقود تكفي بالمبلغ نفسه؟`,spokenPrompt:`ثمن الشيء ${price} ريالًا. اختر النقود التي تساوي الثمن تمامًا.`,price,options,correctAnswer:correctValue};
}

export function createMoneyRoundQuestion(index,{random=Math.random}={}){
  switch(index%5){
    case 0:return createMoneyRecognitionQuestion({random});
    case 1:return createCountMoneyQuestion({random});
    case 2:return createMoneyModelQuestion({random});
    case 3:return createEqualAmountsQuestion({random});
    default:return createUseMoneyQuestion({random});
  }
}
