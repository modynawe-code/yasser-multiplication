function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-measurement"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-measurement.css';
  link.dataset.moduleStyle='khaled-measurement';
  document.head.appendChild(link);
}

const TYPES=Object.freeze(['length-compare','nonstandard-length','measurement-guess-check','mass-compare','capacity-compare']);
export function isMeasurementQuestion(question){return TYPES.includes(question?.type);}

function units(count){return Array.from({length:count},()=>'<span class="khaled-measure-unit" aria-hidden="true"></span>').join('');}
function blocks(count){return Array.from({length:count},()=>'<span class="khaled-mass-block" aria-hidden="true"></span>').join('');}
function sideButton(side,inner,label){return `<button class="khaled-measure-choice" data-measure-answer="${side}" aria-label="${label}">${inner}</button>`;}

export function renderMeasurementQuestion({question,visual,answers,createAnswerButton,submitAnswer}){
  ensureStyle();
  if(question.type==='length-compare'){
    visual.innerHTML=`<div class="khaled-length-compare">${sideButton('left',`<span class="khaled-length-bar" style="--measure:${question.left}"></span>`,'الشريط الأول')}${sideButton('right',`<span class="khaled-length-bar" style="--measure:${question.right}"></span>`,'الشريط الثاني')}</div>`;
    visual.querySelectorAll('[data-measure-answer]').forEach(button=>button.onclick=()=>submitAnswer(button.dataset.measureAnswer,button));
  }else if(question.type==='nonstandard-length'||question.type==='measurement-guess-check'){
    visual.innerHTML=`<div class="khaled-unit-measure"><span class="khaled-object-strip" style="--measure:${question.units}"></span><div class="khaled-unit-row">${units(question.units)}</div><small>${question.type==='measurement-guess-check'?'خمن أولًا ثم عد الوحدات':'كل مربع = وحدة واحدة'}</small></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,String(value))));
  }else if(question.type==='mass-compare'){
    visual.innerHTML=`<div class="khaled-mass-compare">${sideButton('left',`<div class="khaled-mass-stack">${blocks(question.left)}</div><span>⚖️</span>`,'الجهة الأولى')}${sideButton('right',`<div class="khaled-mass-stack">${blocks(question.right)}</div><span>⚖️</span>`,'الجهة الثانية')}</div>`;
    visual.querySelectorAll('[data-measure-answer]').forEach(button=>button.onclick=()=>submitAnswer(button.dataset.measureAnswer,button));
  }else if(question.type==='capacity-compare'){
    visual.innerHTML=`<div class="khaled-capacity-compare">${sideButton('left',`<span class="khaled-cup"><i style="--fill:${question.left}"></i></span>`,'الوعاء الأول')}${sideButton('right',`<span class="khaled-cup"><i style="--fill:${question.right}"></i></span>`,'الوعاء الثاني')}</div>`;
    visual.querySelectorAll('[data-measure-answer]').forEach(button=>button.onclick=()=>submitAnswer(button.dataset.measureAnswer,button));
  }
  return true;
}
