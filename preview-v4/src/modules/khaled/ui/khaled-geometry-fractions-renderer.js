function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-geometry-fractions"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/khaled/ui/khaled-geometry-fractions.css';link.dataset.moduleStyle='khaled-geometry-fractions';document.head.appendChild(link);
}
const TYPES=Object.freeze(['solid-identify','solid-classify','geometry-pattern','plane-solid-classify','plane-shape-identify','equal-parts','fraction-select']);
export function isGeometryFractionsQuestion(question){return TYPES.includes(question?.type);}
function solid(type,size=''){return `<span class="khaled-geo solid ${type} ${size}" aria-hidden="true"></span>`;}
function flat(type,size=''){return `<span class="khaled-geo flat ${type} ${size}" aria-hidden="true"></span>`;}
function item(key,size=''){return ['sphere','cube','cylinder','cone'].includes(key)?solid(key,size):flat(key,size);}
function fraction(kind){const parts=kind==='half'?2:kind==='third'?3:4;return `<span class="khaled-fraction ${kind}" aria-hidden="true">${Array.from({length:parts},(_,i)=>`<i class="${i===0?'filled':''}"></i>`).join('')}</span>`;}
function visualButton({answers,value,html,label,submitAnswer}){const button=document.createElement('button');button.className='khaled-answer khaled-geo-answer';button.innerHTML=html;button.setAttribute('aria-label',label);button.onclick=()=>submitAnswer(value,button);answers.appendChild(button);}
export function renderGeometryFractionsQuestion({question,visual,answers,createAnswerButton,submitAnswer}){
  ensureStyle();
  if(question.type==='solid-identify'){
    visual.innerHTML=`<div class="khaled-geo-stage">${solid(question.solid,'large')}</div>`;
    question.options.forEach(value=>visualButton({answers,value,html:solid(value),label:'خيار مجسم',submitAnswer}));
  }else if(question.type==='solid-classify'){
    visual.innerHTML='<div class="khaled-geo-hint"><span>↻</span><span>▦</span><small>فكر: يتدحرج؟ يتراص؟</small></div>';
    question.options.forEach(value=>visualButton({answers,value,html:solid(value),label:'خيار مجسم',submitAnswer}));
  }else if(question.type==='geometry-pattern'){
    visual.innerHTML=`<div class="khaled-geometry-pattern" dir="ltr">${question.items.map(value=>flat(value)).join('<b>›</b>')}<b>›</b><span class="khaled-geo-missing">؟</span></div>`;
    question.options.forEach(value=>visualButton({answers,value,html:flat(value),label:'خيار شكل',submitAnswer}));
  }else if(question.type==='plane-solid-classify'){
    visual.innerHTML=`<div class="khaled-geo-stage">${item(question.item,'large')}</div>`;
    question.options.forEach(option=>answers.appendChild(createAnswerButton(option.value,option.label)));
  }else if(question.type==='plane-shape-identify'){
    visual.innerHTML=`<div class="khaled-geo-stage">${flat(question.shape,'large')}</div>`;
    question.options.forEach(value=>visualButton({answers,value,html:flat(value),label:'خيار شكل مستو',submitAnswer}));
  }else if(question.type==='equal-parts'){
    visual.innerHTML=`<div class="khaled-equal-parts"><span style="--part:${question.parts[0]}"></span><span style="--part:${question.parts[1]}"></span></div>`;
    question.options.forEach(option=>answers.appendChild(createAnswerButton(option.value,option.label)));
  }else if(question.type==='fraction-select'){
    visual.innerHTML=`<div class="khaled-fraction-target"><small>الجزء المطلوب</small>${fraction(question.target)}</div>`;
    question.options.forEach(value=>visualButton({answers,value,html:fraction(value),label:'خيار كسر',submitAnswer}));
  }
  return true;
}
