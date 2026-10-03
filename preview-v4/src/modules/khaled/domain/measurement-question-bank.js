function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function uniqueOptions(correct,min,max,random=Math.random){const values=new Set([correct]);while(values.size<3)values.add(randomNumber(min,max,random));return shuffle([...values],random);}
function distinctPair(min,max,random=Math.random){let left=randomNumber(min,max,random),right=randomNumber(min,max,random);if(left===right)right=right===max?right-1:right+1;return{left,right};}

export function createLengthCompareQuestion({random=Math.random}={}){
  const {left,right}=distinctPair(3,10,random);
  const askLonger=random()>=.5;
  const correctAnswer=askLonger?(left>right?'left':'right'):(left<right?'left':'right');
  return{id:`length-compare-${left}-${right}-${Math.round(random()*1e7)}`,skillId:'measurement',type:'length-compare',prompt:askLonger?'أي شريط أطول؟':'أي شريط أقصر؟',spokenPrompt:askLonger?'اختر الشريط الأطول.':'اختر الشريط الأقصر.',left,right,correctAnswer};
}

export function createNonstandardLengthQuestion({random=Math.random}={}){
  const units=randomNumber(2,8,random);
  return{id:`unit-length-${units}-${Math.round(random()*1e7)}`,skillId:'measurement',type:'nonstandard-length',prompt:'كم وحدة طول؟',spokenPrompt:'عد وحدات القياس تحت الشريط، ثم اختر العدد.',units,options:uniqueOptions(units,1,10,random),correctAnswer:units};
}

export function createMeasurementGuessQuestion({random=Math.random}={}){
  const units=randomNumber(3,9,random);
  return{id:`measure-guess-${units}-${Math.round(random()*1e7)}`,skillId:'measurement',type:'measurement-guess-check',prompt:'خمن ثم تحقق: كم وحدة تقريبًا؟',spokenPrompt:'انظر إلى طول الشريط مقارنة بوحدة القياس، خمن عدد الوحدات ثم اختر.',units,options:uniqueOptions(units,1,10,random),correctAnswer:units};
}

export function createMassCompareQuestion({random=Math.random}={}){
  const {left,right}=distinctPair(1,8,random);
  const askHeavier=random()>=.5;
  const correctAnswer=askHeavier?(left>right?'left':'right'):(left<right?'left':'right');
  return{id:`mass-compare-${left}-${right}-${Math.round(random()*1e7)}`,skillId:'measurement',type:'mass-compare',prompt:askHeavier?'أي جهة أثقل؟':'أي جهة أخف؟',spokenPrompt:askHeavier?'اختر الجهة الأثقل.':'اختر الجهة الأخف.',left,right,correctAnswer};
}

export function createCapacityCompareQuestion({random=Math.random}={}){
  const {left,right}=distinctPair(2,8,random);
  const askMore=random()>=.5;
  const correctAnswer=askMore?(left>right?'left':'right'):(left<right?'left':'right');
  return{id:`capacity-compare-${left}-${right}-${Math.round(random()*1e7)}`,skillId:'measurement',type:'capacity-compare',prompt:askMore?'أي وعاء سعته أكبر؟':'أي وعاء سعته أصغر؟',spokenPrompt:askMore?'اختر الوعاء الذي يسع أكثر.':'اختر الوعاء الذي يسع أقل.',left,right,correctAnswer};
}

export function createMeasurementRoundQuestion(index,{random=Math.random}={}){
  switch(index%5){
    case 0:return createLengthCompareQuestion({random});
    case 1:return createNonstandardLengthQuestion({random});
    case 2:return createMeasurementGuessQuestion({random});
    case 3:return createMassCompareQuestion({random});
    default:return createCapacityCompareQuestion({random});
  }
}
