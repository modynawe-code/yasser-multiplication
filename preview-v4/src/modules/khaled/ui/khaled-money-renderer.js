import { getSaudiMoneyAsset,hydrateSaudiMoneyImages } from './saudi-money-assets.js';

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-money"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/khaled/ui/khaled-money.css';
  link.dataset.moduleStyle='khaled-money';
  document.head.appendChild(link);
}

const TYPES=Object.freeze(['money-recognition','count-money','money-model','equal-money-amounts','use-money','compare-money-amounts','money-can-buy','money-change']);
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
function clickableMoneySide({value,label,coins,submitAnswer}){
  return `<button class="khaled-money-side" data-answer-value="${value}" aria-label="${label}">${moneySet(coins)}</button>`;
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
  }else if(question.type==='compare-money-amounts'){
    visual.innerHTML=`<div class="khaled-money-compare">${clickableMoneySide({value:'left',label:`المبلغ الأيسر ${question.leftAmount} ريال`,coins:question.left,submitAnswer})}<span class="khaled-money-versus">أكبر؟</span>${clickableMoneySide({value:'right',label:`المبلغ الأيمن ${question.rightAmount} ريال`,coins:question.right,submitAnswer})}</div>`;
    visual.querySelectorAll('[data-answer-value]').forEach(button=>button.onclick=()=>submitAnswer(button.dataset.answerValue,button));
  }else if(question.type==='money-can-buy'){
    visual.innerHTML=`<div class="khaled-money-story"><section><small>معك</small>${moneySet(question.coins)}</section><div class="khaled-price-tag compact"><small>السعر</small><strong>${question.price}</strong><span>ريال</span></div></div>`;
    question.options.forEach(option=>answers.appendChild(createAnswerButton(option.value,option.label)));
  }else if(question.type==='money-change'){
    visual.innerHTML=`<div class="khaled-money-story"><section><small>دفعت</small>${moneySet(question.paidCoins)}</section><div class="khaled-price-tag compact"><small>السعر</small><strong>${question.price}</strong><span>ريال</span></div></div>`;
    question.options.forEach(value=>answers.appendChild(createAnswerButton(value,`${value} ريال`)));
  }
  hydrate(visual);
  hydrate(answers);
  return true;
}
