function randomNumber(min,max,random=Math.random){return Math.floor(random()*(max-min+1))+min;}
function shuffle(values,random=Math.random){return [...values].sort(()=>random()-.5);}
function pick(values,random=Math.random){return values[randomNumber(0,values.length-1,random)];}
const SOLIDS=Object.freeze(['sphere','cube','cylinder','cone']);
const FLATS=Object.freeze(['circle','square','triangle','rectangle']);

export function createSolidIdentifyQuestion({random=Math.random}={}){
  const correctAnswer=pick(SOLIDS,random);
  return{id:`solid-identify-${correctAnswer}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'solid-identify',prompt:'اختر المجسم المطابق',spokenPrompt:'انظر إلى المجسم، ثم اختر المجسم المطابق.',solid:correctAnswer,options:shuffle([...SOLIDS],random),correctAnswer};
}

export function createSolidClassifyQuestion({random=Math.random}={}){
  const variants=[
    {prompt:'أي مجسم يتدحرج بسهولة؟',spokenPrompt:'اختر المجسم الذي يتدحرج بسهولة.',correctAnswer:'sphere'},
    {prompt:'أي مجسم يمكن تكديسه فوق بعض؟',spokenPrompt:'اختر المجسم الذي يمكن تكديسه فوق بعض.',correctAnswer:'cube'},
    {prompt:'أي مجسم يتدحرج ويمكن تكديسه؟',spokenPrompt:'اختر المجسم الذي يتدحرج ويمكن تكديسه.',correctAnswer:'cylinder'}
  ];
  const selected=pick(variants,random);
  return{id:`solid-classify-${selected.correctAnswer}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'solid-classify',...selected,options:shuffle(['sphere','cube','cylinder'],random)};
}

export function createGeometryPatternQuestion({random=Math.random}={}){
  const patterns=[
    {items:['circle','square','circle','square'],answer:'circle'},
    {items:['triangle','triangle','circle','triangle','triangle','circle'],answer:'triangle'},
    {items:['square','rectangle','square','rectangle'],answer:'square'}
  ];
  const selected=pick(patterns,random);
  return{id:`geometry-pattern-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'geometry-pattern',prompt:'وش الشكل اللي يكمل النمط؟',spokenPrompt:'انظر إلى النمط الهندسي، ثم اختر الشكل الذي يكمله.',items:selected.items,options:shuffle(['circle','square','triangle','rectangle'],random),correctAnswer:selected.answer};
}

export function createPlaneSolidClassifyQuestion({random=Math.random}={}){
  const isSolid=random()>=.5,item=isSolid?pick(SOLIDS,random):pick(FLATS,random);
  return{id:`plane-solid-${item}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'plane-solid-classify',prompt:'هل هذا شكل مستوٍ أو مجسم؟',spokenPrompt:'انظر إلى الشكل. هل هو شكل مستو أم مجسم؟',item,itemKind:isSolid?'solid':'flat',options:[{value:'flat',label:'شكل مستوٍ'},{value:'solid',label:'مجسم'}],correctAnswer:isSolid?'solid':'flat'};
}

export function createPlaneShapeQuestion({random=Math.random}={}){
  const correctAnswer=pick(FLATS,random);
  return{id:`plane-shape-${correctAnswer}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'plane-shape-identify',prompt:'اختر الشكل المطابق',spokenPrompt:'انظر إلى الشكل المستوي، ثم اختر الشكل المطابق.',shape:correctAnswer,options:shuffle([...FLATS],random),correctAnswer};
}

export function createEqualPartsQuestion({random=Math.random}={}){
  const equal=random()>=.5,parts=equal?[50,50]:[35,65];
  return{id:`equal-parts-${equal?'yes':'no'}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'equal-parts',prompt:'هل الجزآن متطابقان؟',spokenPrompt:'انظر إلى الجزأين. هل هما متساويان في الحجم؟',parts,options:[{value:'yes',label:'نعم ✓'},{value:'no',label:'لا ✕'}],correctAnswer:equal?'yes':'no'};
}

export function createHalfQuestion({random=Math.random}={}){
  return{id:`half-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'fraction-select',prompt:'أي شكل يمثل النصف؟',spokenPrompt:'اختر الشكل الذي يمثل نصفًا واحدًا من اثنين.',target:'half',options:shuffle(['half','third','quarter'],random),correctAnswer:'half'};
}

export function createThirdQuarterQuestion({random=Math.random}={}){
  const target=random()>=.5?'third':'quarter';
  return{id:`fraction-${target}-${Math.round(random()*1e7)}`,skillId:'geometry-fractions',type:'fraction-select',prompt:target==='third'?'اختر الثلث':'اختر الربع',spokenPrompt:target==='third'?'اختر الشكل الذي يمثل ثلثًا واحدًا من ثلاثة.':'اختر الشكل الذي يمثل ربعًا واحدًا من أربعة.',target,options:shuffle(['half','third','quarter'],random),correctAnswer:target};
}

export function createGeometryFractionsRoundQuestion(index,{random=Math.random}={}){
  switch(index%8){
    case 0:return createSolidIdentifyQuestion({random});
    case 1:return createSolidClassifyQuestion({random});
    case 2:return createGeometryPatternQuestion({random});
    case 3:return createPlaneSolidClassifyQuestion({random});
    case 4:return createPlaneShapeQuestion({random});
    case 5:return createEqualPartsQuestion({random});
    case 6:return createHalfQuestion({random});
    default:return createThirdQuarterQuestion({random});
  }
}
