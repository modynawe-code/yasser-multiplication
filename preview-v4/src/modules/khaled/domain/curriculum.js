export const KHALED_CURRICULUM_META=Object.freeze({
  id:'sa-grade1-math-1448',
  grade:1,
  locale:'ar-SA',
  schoolYear:'1448-1449',
  sourceStructure:'Saudi Grade 1 mathematics F1 structure cross-checked against Wajibati 1447; current-year official ordering remains separately verifiable',
  verificationStatus:'early-skill structure verified; current-year official edition verification pending'
});

export const KHALED_SKILLS=Object.freeze([
  {id:'classify-compare',chapter:1,title:'المقارنة والتصنيف',shortTitle:'تصنيف • يساوي • أكثر وأقل',symbol:'◉',status:'ready',activityTypes:['classify-one-property','classify-two-properties','equality-groups','compare-groups'],lessons:['التصنيف وفق خاصية واحدة','التصنيف وفق أكثر من خاصية','يساوي','أكثر من وأقل من'],goals:['يصنف وفق خاصية واحدة','يصنف وفق خاصيتين معًا','يفهم تساوي مجموعتين','يميز المجموعة الأكثر','يميز المجموعة الأقل']},
  {id:'numbers-0-5',chapter:2,title:'الأعداد حتى 5',shortTitle:'0 إلى 5 • عد وقراءة',symbol:'5',status:'ready',activityTypes:['count-select','spoken-number-select'],lessons:['الأعداد 1،2،3','قراءة الأعداد 1،2،3 وكتابتها','العددان 4،5','قراءة العددين 4،5 وكتابتهما','أحل المسألة: أرسم صورة','قراءة العدد صفر وكتابته'],goals:['يعد عناصر مجموعة حتى 5','يربط الكمية بالعدد الصحيح','يتعرف الرقم عند سماع اسمه','يميز الصفر بصريًا']},
  {id:'position-pattern',chapter:3,title:'الموقع والنمط',shortTitle:'موقع • قبل وبعد • أنماط',symbol:'◆',status:'ready',activityTypes:['position-select','pattern-next'],lessons:['فوق وتحت','أعلى وأوسط وأسفل','قبل وبعد','تحديد الأنماط','إنشاء الأنماط'],goals:['يميز فوق وتحت','يميز أعلى وأوسط وأسفل','يفهم قبل وبعد','يكمل نمطًا بسيطًا','ينشئ نمطًا بسيطًا']},
  {id:'numbers-6-10',chapter:4,title:'الأعداد حتى 10',shortTitle:'6 إلى 10 • مقارنة وترتيب',symbol:'10',status:'ready',activityTypes:['count-select','spoken-number-select','number-compare','number-order','ordinal-select'],lessons:['الأعداد 6،7،8','قراءة الأعداد 6،7،8 وكتابتها','العددان 9،10','قراءة العددين 9،10 وكتابتهما','أحل المسألة: أرسم صورة','مقارنة الأعداد حتى 10','ترتيب الأعداد حتى 10','العدد الترتيبي'],goals:['يعد عناصر مجموعة حتى 10','يتعرف الأرقام 6 إلى 10 عند سماعها','يقارن عددين حتى 10','يكمل ترتيبًا عدديًا حتى 10','يميز الموضع الترتيبي']},
  {id:'numbers-11-20',chapter:5,title:'الأعداد حتى 20',shortTitle:'11 إلى 20 • مقارنة وترتيب',symbol:'20',status:'ready',activityTypes:['count-select','spoken-number-select','number-compare','number-order'],lessons:['العددان 11،12','الأعداد 13،14،15','العددان 16،17','أحل المسألة: أبحث عن نمط','الأعداد 18،19،20','مقارنة الأعداد حتى 20','ترتيب الأعداد حتى 20'],goals:['يعد عناصر من 11 إلى 20','يتعرف الأعداد حتى 20 عند سماعها','يقارن عددين حتى 20','يكمل ترتيبًا عدديًا ضمن 20']},
  {
    id:'addition-foundations',chapter:6,title:'الجمع',shortTitle:'قصص • جمل • تكوين • جمع رأسي',symbol:'+',status:'ready',
    activityTypes:['visual-addition','addition-sentence','zero-addition','number-bond','vertical-addition'],
    lessons:['قصص الجمع','تمثيل الجمع','جمل الجمع','الجمع إلى الصفر','أحل المسألة: أمثلها','تكوين الأعداد 4،5،6','تكوين الأعداد 7،8،9','تكوين الأعداد 10،11،12','الجمع الرأسي'],
    goals:['يفهم ضم مجموعتين','يربط الصورة بجملة جمع','يفهم أن إضافة الصفر لا تغير العدد','يكمل جزءًا مفقودًا لتكوين عدد','يقرأ الجمع الرأسي ويجد الناتج']
  },
  {id:'subtraction-foundations',title:'الطرح',shortTitle:'الطرح',symbol:'−',status:'later',activityTypes:['visual-subtraction'],goals:['يفهم الأخذ من مجموعة','يجد ناتج طرح بسيط ضمن المهارات الأساسية']}
]);

export function getKhaledSkill(id){return KHALED_SKILLS.find(skill=>skill.id===id)||null;}
export function getReadyKhaledSkills(){return KHALED_SKILLS.filter(skill=>skill.status==='ready');}
