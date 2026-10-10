const source=(questions,answers)=>({questions:`https://northelite0.com/uploads/materials/grade_1/${questions}.pdf`,answers:`https://northelite0.com/uploads/materials/grade_1/${answers}.pdf`});
const field=(label,answer)=>({label,answer,accepted:[answer]});
const make=(sources,id,prompt,fields,extra={})=>({id,page:1,topic:'الفترة الأولى · الفصل الأول',prompt,fields,...extra,source:{...sources,questionPage:1,answerPage:1,kind:'worksheet'}});
const mathSources=source('_1791294756','_1791294716'),arabicSources=source('_1791294744','_1791294695');
const config=(id,label,sources,questions)=>({id,label,sources,questions,coverageLabel:'تمارين النموذج فقط',childName:'خالد',gradeLabel:'أول ابتدائي',viewId:'khaledGrade1ReviewView',storageKey:`family:khaled:grade1:${id}:northelite:v1`,assetBase:'assets/reviews/grade1',description:'نموذج محاكي لاختبار الفترة الأولى من الفصل الأول. الأسئلة من غير المحلول والإجابات من المحلول. البنود الناقصة أو المتعارضة خارج الدرجة.'});
export const MATH_REVIEW=config('khaled-math','الرياضيات',mathSources,[
 ...[4,3,1,0,2,5].map((count,index)=>make(mathSources,`khaled-count-${index+1}`,'اكتب عدد الكرات في الشكل داخل المربع.',index===5?[]:[field('عدد الكرات',String(count))],{image:`math-count-${index+1}.webp`,alt:'الشكل الأصلي من مراجعة الرياضيات غير المحلولة',...(index===5?{sourceIssue:'يوجد ٥ كرات في الصورة، لكن المحلول كتب ٤. البند متعارض في المصدر ولا يدخل الدرجة.'}:{})})),
 make(mathSources,'khaled-number-order','اكتب الأعداد مرتبة.',[0,1,2,3,4,5].map((n,i)=>field(`الخانة ${i+1} من اليمين`,String(n))))
]);
const forms=[['م',['مـ','ـمـ','ـم','م']],['ب',['بـ','ـبـ','ـب','ب']],['ل',['لـ','ـلـ','ـل','ل']]];
const positions=['أول الكلمة','وسط الكلمة','آخر الكلمة متصل','آخر الكلمة منفصل'];
export const ARABIC_REVIEW=config('khaled-arabic','لغتي',arabicSources,[
 make(arabicSources,'khaled-long-sounds','اقرأ المقاطع الصوتية التالية وضع دائرة على الصوت الطويل.',[],{image:'arabic-sounds.webp',alt:'المقاطع الصوتية الأصلية من مراجعة لغتي',sourceIssue:'نسخة المحلول لم تحدد الأصوات الطويلة بدوائر. السؤال محفوظ للعرض والمراجعة، ولا يدخل الدرجة لعدم وجود مفتاح حل معتمد.'}),
 ...forms.flatMap(([letter,answers])=>answers.map((answer,index)=>make(arabicSources,`khaled-letter-${letter}-${index}`,`اكتب شكل حرف «${letter}» في ${positions[index]}.`,[field(positions[index],answer)],{handwriting:true,selfReview:true})))
]);
