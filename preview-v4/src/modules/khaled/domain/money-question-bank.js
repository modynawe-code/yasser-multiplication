function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function pick(values,random=Math.random){return values[randomNumber(0,values.length-1,random)];}
function uniqueNumberOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}
function total(values){return values.reduce((sum,value)=>sum+value,0);}
function coinsFor(amount){const coins=[];let rest=amount;while(rest>=10){coins.push(10);rest-=10;}while(rest>=5){coins.push(5);rest-=5;}while(rest>0){coins.push(1);rest-=1;}return coins;}
function alternateCoinsFor(amount){if(amount===2)return[1,1];if(amount===5)return[1,1,1,1,1];if(amount===10)return[5,5];if(amount===15)return[5,5,5];if(amount===20)return[10,5,5];return coinsFor(amount);}
function moneyOption(amount,prefix){return{value:`${prefix}-${amount}`,coins:coinsFor(amount),amount};}

const INTRO_SETS=Object.freeze([
  Object.freeze([1]),
  Object.freeze([1,1]),
  Object.freeze([5]),
  Object.freeze([10])
]);

export function createMoneyRecognitionQuestion({random=Math.random}={}){
  const coins=[...pick(INTRO_SETS,random)],correctAnswer=total(coins);
  return{id:`money-recognition-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-recognition',prompt:'كم قيمة النقود؟',spokenPrompt:'انظر إلى النقود. كم ريالًا تمثل؟',coins,options:shuffle([1,2,5,10],random),correctAnswer};
}

export function createCountMoneyQuestion({random=Math.random}={}){
  const pools=[[1,1,1],[5,1,1],[5,5,1],[10,5,1],[10,5,5],[10,10,5]];
  const coins=[...pick(pools,random)],correctAnswer=total(coins);
  return{id:`count-money-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'count-money',prompt:'عد النقود، كم المجموع؟',spokenPrompt:'عد قيم النقود، ثم اختر المبلغ الكلي.',coins,options:uniqueNumberOptions(correctAnswer,1,30,random),correctAnswer};
}

export function createMoneyModelQuestion({random=Math.random}={}){
  const target=pick([2,6,7,10,11,12,15,16,20],random);
  const correct={value:`target-${target}`,coins:coinsFor(target),amount:target};
  const lower=Math.max(1,target-1),upper=Math.min(25,target+1);
  const options=shuffle([correct,moneyOption(lower,'lower'),moneyOption(upper,'upper')],random);
  return{id:`money-model-${target}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-model',prompt:`أي نقود تمثل ${target} ريال؟`,spokenPrompt:`اختر مجموعة النقود التي تساوي ${target} ريالًا.`,target,options,correctAnswer:correct.value};
}

export function createEqualAmountsQuestion({random=Math.random}={}){
  const target=pick([2,5,10,15,20],random),left=coinsFor(target),equal=random()>=.5;
  const right=equal?alternateCoinsFor(target):coinsFor(target===20?15:target+1);
  return{id:`money-equal-${target}-${equal?'yes':'no'}-${Math.round(random()*1e7)}`,skillId:'money',type:'equal-money-amounts',prompt:'هل المبلغان متساويان؟',spokenPrompt:'عد النقود في الجهتين. هل المبلغان متساويان؟',left,right,options:[{value:'yes',label:'نعم ✓'},{value:'no',label:'لا ✕'}],correctAnswer:equal?'yes':'no'};
}

export function createUseMoneyQuestion({random=Math.random}={}){
  const price=pick([3,6,8,10,12,15],random);
  const correct={value:`buy-${price}`,coins:coinsFor(price),amount:price};
  const lower=Math.max(1,price-1),upper=price+1;
  const options=shuffle([correct,moneyOption(lower,'less'),moneyOption(upper,'more')],random);
  return{id:`use-money-${price}-${Math.round(random()*1e7)}`,skillId:'money',type:'use-money',prompt:`السعر ${price} ريال، أي نقود تساوي السعر؟`,spokenPrompt:`ثمن الشيء ${price} ريالًا. اختر النقود التي تساوي الثمن تمامًا.`,price,options,correctAnswer:correct.value};
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
