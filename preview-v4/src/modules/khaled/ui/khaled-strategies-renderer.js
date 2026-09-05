function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-strategies"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-strategies.css';
  link.dataset.moduleStyle='khaled-strategies';
  document.head.appendChild(link);
}

const TYPES=Object.freeze([
  'count-on-addition',
  'number-line-addition',
  'count-back-subtraction',
  'number-sentence',
  'number-line-subtraction'
]);

export function isStrategiesQuestion(question){return TYPES.includes(question?.type);}

function stepDots(steps,direction){
  const arrow=direction==='forward'?'→':'←';
  return Array.from({length:steps},()=>`<span class="khaled-strategy-step">${arrow}</span>`).join('');
}

function numberLine(question){
  const max=Number(question.max||12);
  const end=question.direction==='forward'?question.start+question.steps:question.start-question.steps;
  const ticks=Array.from({length:max+1},(_,value)=>{
    const classes=['khaled-line-tick'];
    if(value===question.start)classes.push('start');
    if(value===end)classes.push('target');
    return `<span class="${classes.join(' ')}"><i></i><b>${value}</b></span>`;
  }).join('');
  return `<div class="khaled-strategy-number-line" dir="ltr"><div class="khaled-line-jump ${question.direction}"><span>${question.direction==='forward'?'+':'−'}${question.steps}</span></div><div class="khaled-line-track">${ticks}</div></div>`;
}

function strategyCount(question){
  return `<div class="khaled-count-strategy" dir="ltr"><strong>${question.start}</strong><div class="khaled-strategy-steps">${stepDots(question.steps,question.direction)}</div><span>؟</span></div>`;
}

function sentencePrompt(question){
  if(question.operation==='addition')return `<div class="khaled-sentence-scene"><span>${question.left}</span><b>+</b><span>${question.right}</span><b>=</b><i>؟</i></div>`;
  return `<div class="khaled-sentence-scene"><span>${question.start}</span><b>−</b><span>${question.removed}</span><b>=</b><i>؟</i></div>`;
}

export function renderStrategiesQuestion({question,visual,answers,createAnswerButton}){
  ensureStyle();
  if(question.type==='count-on-addition'||question.type==='count-back-subtraction'){
    visual.innerHTML=strategyCount(question);
  }else if(question.type==='number-line-addition'||question.type==='number-line-subtraction'){
    visual.innerHTML=numberLine(question);
  }else if(question.type==='number-sentence'){
    visual.innerHTML=sentencePrompt(question);
    answers.classList.add('khaled-equation-answers');
  }
  question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  return true;
}
