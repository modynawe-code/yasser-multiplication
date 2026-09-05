function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-number-patterns"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/khaled/ui/khaled-number-patterns.css';link.dataset.moduleStyle='khaled-number-patterns';document.head.appendChild(link);
}
const TYPES=Object.freeze(['count-by-tens','find-number-pattern','hundred-chart','skip-count']);
export function isNumberPatternsQuestion(question){return TYPES.includes(question?.type);}
function sequence(values){return values.map(value=>value===null?'<span class="khaled-pattern-number missing">؟</span>':`<span class="khaled-pattern-number">${value}</span>`).join('<i aria-hidden="true">←</i>');}
export function renderNumberPatternsQuestion({question,visual,answers,createAnswerButton}){
  ensureStyle();
  if(question.type==='count-by-tens'||question.type==='find-number-pattern'||question.type==='skip-count'){
    visual.innerHTML=`<div class="khaled-number-pattern-stage"><div class="khaled-pattern-step">+${question.step}</div><div class="khaled-number-pattern-row" dir="ltr">${sequence(question.values)}</div></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='hundred-chart'){
    const next=question.number+1,below=question.number+10;
    visual.innerHTML=`<div class="khaled-hundred-card"><small>لوحة المئة</small><div class="khaled-hundred-mini"><span class="focus">${question.number}</span><span class="${question.direction==='next'?'target':''}">${question.direction==='next'?'؟':next}</span><span class="${question.direction==='below'?'target':''}">${question.direction==='below'?'؟':below}</span></div></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }
  return true;
}
