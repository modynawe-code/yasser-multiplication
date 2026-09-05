function dots(count){return Array.from({length:count},()=>'<span class="khaled-dot" aria-hidden="true"></span>').join('');}

export function ensureKhaledAdditionStyles(){
  if(document.querySelector('link[data-module-style="khaled-addition"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-addition.css';
  link.dataset.moduleStyle='khaled-addition';
  document.head.appendChild(link);
}

export function isAdditionQuestion(question){
  return ['visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition'].includes(question?.type);
}

export function renderAdditionQuestion({question,visual,answers,createAnswerButton}){
  ensureKhaledAdditionStyles();

  if(question.type==='visual-addition'){
    visual.innerHTML=`<div class="khaled-addition" dir="ltr"><div class="khaled-add-group">${dots(question.left)}</div><span class="khaled-add-sign">+</span><div class="khaled-add-group">${dots(question.right)}</div><span class="khaled-add-sign">=</span><span class="khaled-add-question">؟</span></div>`;
  }else if(question.type==='addition-sentence'||question.type==='zero-addition'){
    visual.innerHTML=`<div class="khaled-addition-sentence" dir="ltr"><span>${question.left}</span><b>+</b><span>${question.right}</span><b>=</b><i>؟</i></div>`;
  }else if(question.type==='number-bond'){
    visual.innerHTML=`<div class="khaled-number-bond" aria-label="تكوين العدد"><strong>${question.total}</strong><div><span>${question.known}</span><span>؟</span></div></div>`;
  }else if(question.type==='vertical-addition'){
    visual.innerHTML=`<div class="khaled-vertical-addition" dir="ltr"><span>${question.left}</span><span class="with-plus">${question.right}</span><hr><strong>؟</strong></div>`;
  }

  question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  return true;
}
