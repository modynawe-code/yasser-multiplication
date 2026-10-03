function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-place-value"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-place-value.css';
  link.dataset.moduleStyle='khaled-place-value';
  document.head.appendChild(link);
}

const TYPES=Object.freeze(['place-value-model','place-value-clue','number-to-50','number-to-100','estimate-nearest-ten','compare-to-100','order-to-100']);
export function isPlaceValueQuestion(question){return TYPES.includes(question?.type);}

function tensMarkup(count){return Array.from({length:count},()=>'<span class="khaled-ten-rod" aria-hidden="true"></span>').join('');}
function onesMarkup(count){return Array.from({length:count},()=>'<span class="khaled-one-cube" aria-hidden="true"></span>').join('');}

function model(question){
  return `<div class="khaled-place-model"><section><strong>العشرات</strong><div class="khaled-tens">${tensMarkup(question.tens)}</div><b>${question.tens}</b></section><section><strong>الآحاد</strong><div class="khaled-ones">${onesMarkup(question.ones)}</div><b>${question.ones}</b></section></div>`;
}

function clue(question){
  return `<div class="khaled-place-clue"><div><strong>${question.tens}</strong><span>عشرات</span></div><b>+</b><div><strong>${question.ones}</strong><span>آحاد</span></div><b>=</b><i>؟</i></div>`;
}

export function renderPlaceValueQuestion({question,visual,answers,createAnswerButton,submitAnswer}){
  ensureStyle();
  if(question.type==='place-value-model'){
    visual.innerHTML=model(question);
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='place-value-clue'){
    visual.innerHTML=clue(question);
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='number-to-50'||question.type==='number-to-100'){
    visual.innerHTML=`<div class="khaled-place-audio"><span>🔊</span><small>اسمع العدد ثم اختره</small><b>حتى ${question.rangeMax}</b></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='estimate-nearest-ten'){
    visual.innerHTML=`<div class="khaled-estimate"><small>العدد</small><strong>${question.exact}</strong><span>أي عشرة أقرب؟</span></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='compare-to-100'){
    visual.innerHTML=`<div class="khaled-place-compare" dir="ltr"><button data-place-answer="${question.left}">${question.left}</button><span>↔</span><button data-place-answer="${question.right}">${question.right}</button></div>`;
    visual.querySelectorAll('[data-place-answer]').forEach(button=>button.onclick=()=>submitAnswer(Number(button.dataset.placeAnswer),button));
  }else if(question.type==='order-to-100'){
    visual.innerHTML=`<div class="khaled-order-prompt" dir="ltr">${question.numbers.map(value=>`<span>${value}</span>`).join('')}</div>`;
    answers.classList.add('khaled-order-answers');
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,value)));
  }
  return true;
}
