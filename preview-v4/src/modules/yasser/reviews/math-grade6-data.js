export const SOURCES=Object.freeze({questions:'https://northelite0.com/uploads/materials/grade_6/_1791396177.pdf',answers:'https://northelite0.com/uploads/materials/grade_6/_1791275685.pdf'});
const field=(label,answer,accepted=[answer])=>({label,answer,accepted});
const q=(id,page,topic,prompt,fields,extra={})=>({id,page,topic,prompt,fields,...extra,source:{questions:SOURCES.questions,answers:SOURCES.answers,questionPage:page,answerPage:page}});
export const MATH_QUESTIONS=[
 q('prime-7',2,'العوامل الأولية','العدد ٧ هو عدد ........',[field('الإجابة','أولي',['أولي','اولي'])]),
 q('composite-12',2,'العوامل الأولية','العدد ١٢ هو عدد ........',[field('الإجابة','غير أولي',['غير أولي','غير اولي','مركب'])]),
 q('factors-18',2,'العوامل الأولية','عند تحليل العدد ١٨ إلى عوامله الأولية يكتب على الصورة .....................',[field('الإجابة','٢ × ٣ × ٣',['2×3×3','3×2×3','3×3×2','2*3*3','3*2*3','3*3*2'])],{math:true}),
 q('power',2,'القوى والأسس','الصورة الأسية لـ ٥ × ٥ × ٥ = ........',[field('الإجابة','٥³',['5^3','5³','٥ أس ٣','خمسة أس ثلاثة'])],{math:true}),
 q('operations',3,'ترتيب العمليات','احسب قيمة العبارة:',[field('الإجابة','٥٦')],{expression:'20 ÷ 4 + 17 × (9 − 6)'}),
 q('variable-s',3,'المتغيرات والعبارات','مثال) اذا كانت س = ٥ فان قيمة ٢س = ........',[field('الإجابة','١٠')]),
 q('variable-n',3,'المتغيرات والعبارات','مثال) إذا كانت ن = ٣، فما قيمة العبارة ٥ن + ٤؟',[field('الإجابة','١٩')]),
 q('function-table',4,'الدوال','أكمل جدول الدالة:',[field('قاعدة الدالة عند س = ٥','٥ + ٣',['5+3','3+5']),field('المخرجة عند س = ٥','٨'),field('قاعدة الدالة عند س = ٦','٦ + ٣',['6+3','3+6']),field('المخرجة عند س = ٦','٩')],{table:true}),
 q('equation-y',4,'المعادلات','حل المعادلات الآتية:',[field('ص =','٥',['5','ص=5'])],{expression:'٣ص = ١٥'}),
 q('equation-s',4,'المعادلات','حل المعادلات الآتية:',[field('س =','١٠',['10','س=10'])],{expression:'١٥ + س = ٢٥'}),
 q('chart-winner',5,'التمثيل بالأعمدة والخطوط','من الشكل المقابل: ما هو الصف الذي فاز بأكبر عدد من البطولات؟',[field('الإجابة','الخامس',['الخامس','الصف الخامس','خامس'])],{image:'championships.webp',alt:'البطولات الرياضية للصفوف، الرسم الأصلي من المراجعة'}),
 q('chart-difference',5,'التمثيل بالأعمدة والخطوط','ما هو الفرق بين عدد بطولات الصف السادس والرابع؟',[field('الإجابة','٣')],{image:'championships.webp',alt:'البطولات الرياضية للصفوف، الرسم الأصلي من المراجعة'}),
 q('mean',5,'المتوسط الحسابي','المتوسط الحسابي للأعداد: ١٠، ١١، ١٤، ٩ هو ........',[field('الإجابة','١١')],{choices:['١٠','١١','١٢','١٣']}),
 q('median',6,'المنوال والوسيط والمدى','أوجد الوسيط لأعداد أعضاء الإذاعة المدرسية من عام ١٤٣٤ إلى عام ١٤٣٨هـ (١٤، ٢٦، ٤٠، ١٩، ٢١)',[field('الإجابة','٢١')],{choices:['٢١','٢٥','٢٦','٣٠']}),
 q('dot-plot',6,'المنوال والوسيط والمدى','من الشكل السابق أوجد المنوال والمدى للتمثيل بالنقاط',[field('المنوال','١٢'),field('المدى','١٤')],{image:'books.webp',alt:'أسعار كتب الأطفال بالريال، التمثيل بالنقاط الأصلي من المراجعة'})
];
export function normalizeAnswer(value){return String(value??'').replace(/³/g,'^3').normalize('NFKC').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[\s\u200e\u200f\u202a-\u202e\u2066-\u2069ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/[xX*]/g,'×').replace(/−/g,'-');}
export function gradeAnswer(question,values){return question.fields.map((f,i)=>f.accepted.some(a=>normalizeAnswer(a)===normalizeAnswer(values?.[i])));}
export function summarize(questions,responses){let correct=0,wrong=0,unanswered=0;for(const q of questions){const r=responses[q.id];if(!r){unanswered++;continue;}if(r.correct.every(Boolean))correct++;else wrong++;}return{correct,wrong,unanswered,total:questions.length,percent:Math.round(correct/questions.length*100)};}
