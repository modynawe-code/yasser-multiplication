function dots(count,{removed=0}={}){
  return Array.from({length:count},(_,index)=>`<span class="khaled-dot${index>=count-removed?' removed':''}" aria-hidden="true"></span>`).join('');
}

export function ensureKhaledSubtractionStyles(){
  if(document.querySelector('link[data-module-style="khaled-subtraction"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-subtraction.css';
  link.dataset.moduleStyle='khaled-subtraction';
  document.head.appendChild(link);
}

export function isSubtractionQuestion(question){
  return ['visual-subtraction','subtraction-sentence','zero-whole-subtraction','vertical-subtraction'].includes(question?.type);
}

export function renderSubtractionQuestion({question,visual,answers,createAnswerButton}){
  ensureKhaledSubtractionStyles();
  if(question.type==='visual-subtraction'){
    visual.innerHTML=`<div class="khaled-subtraction-story"><div class="khaled-subtract-group">${dots(question.start,{removed:question.removed})}</div><div class="khaled-subtraction-caption"><span>${question.start}</span><b>−</b><span>${question.removed}</span><b>=</b><i>؟</i></div></div>`;
  }else if(question.type==='subtraction-sentence'||question.type==='zero-whole-subtraction'){
    visual.innerHTML=`<div class="khaled-subtraction-sentence" dir="ltr"><span>${question.start}</span><b>−</b><span>${question.removed}</span><b>=</b><i>؟</i></div>`;
  }else if(question.type==='vertical-subtraction'){
    visual.innerHTML=`<div class="khaled-vertical-subtraction" dir="ltr"><span>${question.start}</span><span class="with-minus">${question.removed}</span><hr><strong>؟</strong></div>`;
  }
  question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  return true;
}
