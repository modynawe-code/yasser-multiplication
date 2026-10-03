function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function pick(values,random=Math.random){return values[randomNumber(0,values.length-1,random)];}
function uniqueNumberOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}
function total(values){return values.reduce((sum,value)=>sum+value,0);}
function moneyFor(amount){
  const pieces=[];let rest=amount;
  while(rest>=10){pieces.push(10);rest-=10;}
  while(rest>=5){pieces.push(5);rest-=5;}
  while(rest>=2){pieces.push(2);rest-=2;}
  while(rest>0){pieces.push(1);rest-=1;}
  return pieces;
}
function alternateMoneyFor(amount){
  if(amount===2)return[1,1];
  if(amount===5)return[2,2,1];
  if(amount===10)return[5,2,2,1];
  if(amount===15)return[10,2,2,1];
  if(amount===20)return[10,5,2,2,1];
  return moneyFor(amount);
}
function moneyOption(amount,prefix){return{value:`${prefix}-${amount}`,coins:moneyFor(amount),amount};}

const INTRO_SETS=Object.freeze([
  Object.freeze([1]),
  Object.freeze([2]),
  Object.freeze([5]),
  Object.freeze([10])
]);

export function createMoneyRecognitionQuestion({random=Math.random}={}){
  const coins=[...pick(INTRO_SETS,random)],correctAnswer=total(coins);
  return{id:`money-recognition-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-recognition',prompt:'كم قيمة النقود؟',spokenPrompt:'انظر إلى النقود. كم ريالًا تمثل؟',coins,options:shuffle([1,2,5,10],random),correctAnswer};
}

export function createCountMoneyQuestion({random=Math.random}={}){
  const pools=[[2,1],[5,2,1],[5,5,2],[10,5,2],[10,5,2,1],[10,10,5,2]];
  const coins=[...pick(pools,random)],correctAnswer=total(coins);
  return{id:`count-money-${coins.join('-')}-${Math.round(random()*1e7)}`,skillId:'money',type:'count-money',prompt:'عد النقود، كم المجموع؟',spokenPrompt:'عد قيم النقود، ثم اختر المبلغ الكلي.',coins,options:uniqueNumberOptions(correctAnswer,1,30,random),correctAnswer};
}

export function createMoneyModelQuestion({random=Math.random}={}){
  const target=pick([2,6,7,10,11,12,15,16,20],random);
  const correct={value:`target-${target}`,coins:moneyFor(target),amount:target};
  const lower=Math.max(1,target-1),upper=Math.min(25,target+1);
  const options=shuffle([correct,moneyOption(lower,'lower'),moneyOption(upper,'upper')],random);
  return{id:`money-model-${target}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-model',prompt:`أي نقود تمثل ${target} ريال؟`,spokenPrompt:`اختر مجموعة النقود التي تساوي ${target} ريالًا.`,target,options,correctAnswer:correct.value};
}

export function createEqualAmountsQuestion({random=Math.random}={}){
  const target=pick([2,5,10,15,20],random),left=moneyFor(target),equal=random()>=.5;
  const right=equal?alternateMoneyFor(target):moneyFor(target===20?15:target+1);
  return{id:`money-equal-${target}-${equal?'yes':'no'}-${Math.round(random()*1e7)}`,skillId:'money',type:'equal-money-amounts',prompt:'هل المبلغان متساويان؟',spokenPrompt:'عد النقود في الجهتين. هل المبلغان متساويان؟',left,right,options:[{value:'yes',label:'نعم ✓'},{value:'no',label:'لا ✕'}],correctAnswer:equal?'yes':'no'};
}

export function createUseMoneyQuestion({random=Math.random}={}){
  const price=pick([3,6,8,10,12,15],random);
  const correct={value:`buy-${price}`,coins:moneyFor(price),amount:price};
  const lower=Math.max(1,price-1),upper=price+1;
  const options=shuffle([correct,moneyOption(lower,'less'),moneyOption(upper,'more')],random);
  return{id:`use-money-${price}-${Math.round(random()*1e7)}`,skillId:'money',type:'use-money',prompt:`السعر ${price} ريال، أي نقود تساوي السعر؟`,spokenPrompt:`ثمن الشيء ${price} ريالًا. اختر النقود التي تساوي الثمن تمامًا.`,price,options,correctAnswer:correct.value};
}

export function createCompareMoneyQuestion({random=Math.random}={}){
  const pair=pick([[3,5],[6,4],[7,10],[12,9],[15,11],[18,20]],random),swap=random()>.5;
  const [a,b]=swap?[pair[1],pair[0]]:pair,left=moneyFor(a),right=moneyFor(b),correctAnswer=a>b?'left':'right';
  return{id:`money-compare-${a}-${b}-${Math.round(random()*1e7)}`,skillId:'money',type:'compare-money-amounts',prompt:'أي المبلغين أكبر؟',spokenPrompt:'عد النقود في الجهتين، ثم اختر المبلغ الأكبر.',left,right,leftAmount:a,rightAmount:b,correctAnswer};
}

export function createCanBuyQuestion({random=Math.random}={}){
  const price=pick([4,5,6,8,10,12],random),enough=random()>=.5,available=enough?pick([price,price+2,price+5],random):Math.max(1,price-pick([1,2,3],random));
  return{id:`money-can-buy-${available}-${price}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-can-buy',prompt:`معك ${available} ريال والسعر ${price} ريال. هل يكفي؟`,spokenPrompt:`معك ${available} ريالًا، والسعر ${price} ريالًا. هل المبلغ يكفي للشراء؟`,available,price,coins:moneyFor(available),options:[{value:'yes',label:'نعم، يكفي'},{value:'no',label:'لا، لا يكفي'}],correctAnswer:available>=price?'yes':'no'};
}

export function createMoneyChangeQuestion({random=Math.random}={}){
  const paid=pick([5,10,15,20],random),price=randomNumber(1,paid-1,random),correctAnswer=paid-price;
  return{id:`money-change-${paid}-${price}-${Math.round(random()*1e7)}`,skillId:'money',type:'money-change',prompt:`دفعت ${paid} ريال والسعر ${price} ريال. كم يتبقى؟`,spokenPrompt:`دفعت ${paid} ريالًا، والسعر ${price} ريالًا. كم ريالًا يتبقى؟`,paid,price,paidCoins:moneyFor(paid),options:uniqueNumberOptions(correctAnswer,0,Math.max(10,paid),random),correctAnswer};
}

export const MONEY_ACTIVITY_TYPES=Object.freeze([
  'money-recognition','count-money','money-model','equal-money-amounts','use-money','compare-money-amounts','money-can-buy','money-change'
]);

export function createMoneyRoundQuestion(index,{random=Math.random}={}){
  switch(index%MONEY_ACTIVITY_TYPES.length){
    case 0:return createMoneyRecognitionQuestion({random});
    case 1:return createCountMoneyQuestion({random});
    case 2:return createMoneyModelQuestion({random});
    case 3:return createEqualAmountsQuestion({random});
    case 4:return createUseMoneyQuestion({random});
    case 5:return createCompareMoneyQuestion({random});
    case 6:return createCanBuyQuestion({random});
    default:return createMoneyChangeQuestion({random});
  }
}
