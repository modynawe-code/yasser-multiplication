import { getSaudiMoneyAsset,hydrateSaudiMoneyImages } from './saudi-money-assets.js';

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-money"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-money.css';
  link.dataset.moduleStyle='khaled-money';
  document.head.appendChild(link);
}

const TYPES=Object.freeze(['money-recognition','count-money','money-model','equal-money-amounts','use-money']);
export function isMoneyQuestion(question){return TYPES.includes(question?.type);}

function moneyPiece(value){
  const asset=getSaudiMoneyAsset(value);
  return `<span class="khaled-money-piece ${asset.kind} value-${asset.value}" aria-hidden="true">
    <img class="khaled-money-photo" data-saudi-money-value="${asset.value}" alt="" decoding="async" />
    <span class="khaled-money-fallback" hidden><b>${asset.value}</b><small>${asset.label}</small></span>
  </span>`;
}
function moneySet(values){return `<div class="khaled-money-set">${values.map(moneyPiece).join('')}</div>`;}
function hydrate(root){hydrateSaudiMoneyImages(root);}
function optionButton({answers,option,submitAnswer}){
  const button=document.createElement('button');
  button.className='khaled-answer khaled-money-option';
  button.dataset.answerValue=String(option.value);
  button.innerHTML=moneySet(option.coins);
  button.setAttribute('aria-label',`مجموعة نقود قيمتها ${option.amount ?? option.coins.reduce((a,b)=>a+b,0)} ريال`);
  button.onclick=()=>submitAnswer(option.value,button);
  answers.appendChild(button);
}

export function renderMoneyQuestion({question,visual,answers,createAnswerButton,submitAnswer}){
  ensureStyle();
  if(question.type==='money-recognition'||question.type==='count-money'){
    visual.innerHTML=`<div class="khaled-money-stage">${moneySet(question.coins)}</div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,`${value} ريال`)));
  }else if(question.type==='money-model'){
    visual.innerHTML=`<div class="khaled-money-target"><small>المبلغ المطلوب</small><strong>${question.target}</strong><span>ريال</span></div>`;
    question.options.forEach(option=>optionButton({answers,option,submitAnswer}));
  }else if(question.type==='equal-money-amounts'){
    visual.innerHTML=`<div class="khaled-money-equality"><section>${moneySet(question.left)}</section><b>؟</b><section>${moneySet(question.right)}</section></div>`;
    question.options.forEach(option=>answers.appendChild(createAnswerButton(option.value,option.label)));
  }else if(question.type==='use-money'){
    visual.innerHTML=`<div class="khaled-price-tag"><small>السعر</small><strong>${question.price}</strong><span>ريال</span></div>`;
    question.options.forEach(option=>optionButton({answers,option,submitAnswer}));
  }
  hydrate(visual);
  hydrate(answers);
  return true;
}
