import {createReviewController} from './review-runtime.js';
const subjects=[['digital','المهارات الرقمية',19],['arabic','اللغة العربية',27],['english','اللغة الإنجليزية',36],['science','العلوم',158],['social','الدراسات الاجتماعية',29],['islamic','الدراسات الإسلامية',20]];
const controllers=new Map();
export function openGrade6Reviews({onBack}={}){
 if(!document.querySelector('link[data-module-style="math-grade6"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='src/modules/yasser/reviews/math-grade6.css';l.dataset.moduleStyle='math-grade6';document.head.append(l);}
 let view=document.getElementById('yasserGrade6ReviewView');
 if(!view){view=document.createElement('section');view.id='yasserGrade6ReviewView';view.className='view';document.querySelector('#introView').parentElement.append(view);}
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v===view));
 document.body.classList.remove('intro-mode','hub-mode','yasser-science-mode','yasser-quran-mode');
 view.innerHTML=`<div class="review-toolbar"><button id="grade6Back">رجوع لمواد ياسر</button></div><h1 tabindex="-1">مراجعات سادس يا ياسر</h1><p>اختر مادتك. لكل مادة تدريب واختبار وسجل مستقل، من مراجعات نخبة الشمال فقط.</p><div class="review-subjects">${subjects.map(([id,label,count])=>`<button data-review-subject="${id}"><strong>${label}</strong><small>${count} سؤالًا · تدريب واختبار · حفظ التقدم</small><span>ابدأ</span></button>`).join('')}</div><p role="status" id="grade6Notice"></p>`;
 view.querySelector('#grade6Back').onclick=()=>{view.classList.remove('active');onBack?.();};
 for(const b of view.querySelectorAll('[data-review-subject]'))b.onclick=async()=>{
  b.disabled=true;
  try{const id=b.dataset.reviewSubject;if(!controllers.has(id)){const {REVIEW}=await import(`./${id}-grade6-data.js`);controllers.set(id,createReviewController({...REVIEW,assetBase:'assets/reviews/grade6'}));}controllers.get(id).openReview({onBack:()=>openGrade6Reviews({onBack})});}
  catch{b.disabled=false;view.querySelector('#grade6Notice').textContent='تعذر فتح المادة. حاول مرة أخرى يا ياسر.';}
 };
 window.scrollTo(0,0);view.querySelector('h1').focus();
}
