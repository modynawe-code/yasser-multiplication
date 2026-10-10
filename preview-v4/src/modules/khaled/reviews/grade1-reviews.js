import {createReviewController} from '../../yasser/reviews/review-runtime.js';
import {MATH_REVIEW,ARABIC_REVIEW} from './grade1-data.js';
const controllers=new Map();
export function openKhaledGrade1Reviews({onBack}={}){
 let view=document.getElementById('khaledGrade1ReviewView');
 if(!view){view=document.createElement('section');view.id='khaledGrade1ReviewView';view.className='view';document.querySelector('main').append(view);}
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v===view));
 document.body.classList.add('khaled-mode');document.body.classList.remove('hub-mode','intro-mode');
 if(!document.querySelector('link[data-module-style="math-grade6"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='src/modules/yasser/reviews/math-grade6.css';l.dataset.moduleStyle='math-grade6';document.head.append(l);}
 view.innerHTML='<button id="grade1Back">رجوع لمواد خالد</button><h1 tabindex="-1">اختبارات ومراجعات أول ابتدائي · خالد</h1><p>الفترة الأولى من الفصل الأول · لكل مادة تدريب واختبار وسجل مستقل على هذا الجهاز.</p><div class="review-subjects"><button data-grade1="math"><strong>الرياضيات</strong><small>٧ بنود · ٦ تدخل الدرجة · عدّ الكرات وترتيب الأعداد</small></button><button data-grade1="arabic"><strong>لغتي</strong><small>١٣ بندًا · ١٢ تدخل الدرجة · كتابة أشكال الحروف باللمس والمقارنة بالنموذج</small></button></div>';
 view.querySelector('#grade1Back').onclick=()=>{view.classList.remove('active');onBack?.();};
 for(const b of view.querySelectorAll('[data-grade1]'))b.onclick=()=>{const review=b.dataset.grade1==='math'?MATH_REVIEW:ARABIC_REVIEW;if(!controllers.has(review.id))controllers.set(review.id,createReviewController(review));controllers.get(review.id).openReview({onBack:()=>openKhaledGrade1Reviews({onBack})});};
 view.querySelector('h1').focus();window.scrollTo(0,0);
}
