export const KHALED_CURRICULUM_META=Object.freeze({
  id:'sa-grade1-math-1448',
  grade:1,
  locale:'ar-SA',
  schoolYear:'1448-1449',
  sourceStructure:'Saudi Grade 1 mathematics F1 structure cross-checked against Wajibati 1447; current-year official ordering remains separately verifiable',
  verificationStatus:'early-skill structure verified; current-year official edition verification pending'
});

export const KHALED_SKILLS=Object.freeze([
  {
    id:'classify-compare',
    chapter:1,
    title:'المقارنة والتصنيف',
    shortTitle:'تصنيف • يساوي • أكثر وأقل',
    symbol:'◉',
    status:'ready',
    activityTypes:['compare-groups'],
    lessons:[
      'التصنيف وفق خاصية واحدة',
      'التصنيف وفق أكثر من خاصية',
      'يساوي',
      'أكثر من وأقل من'
    ],
    goals:['يميز المجموعة الأكثر','يميز المجموعة الأقل','يطابق الأشياء المتشابهة','يفهم تساوي مجموعتين']
  },
  {
    id:'numbers-0-5',
    chapter:2,
    title:'الأعداد حتى 5',
    shortTitle:'0 إلى 5',
    symbol:'5',
    status:'ready',
    activityTypes:['count-select'],
    goals:['يعد عناصر مجموعة حتى 5','يربط الكمية بالعدد الصحيح']
  },
  {
    id:'position-pattern',
    chapter:3,
    title:'الموقع والنمط',
    shortTitle:'موقع • قبل وبعد • أنماط',
    symbol:'◆',
    status:'ready',
    activityTypes:['position-select','pattern-next'],
    lessons:[
      'فوق وتحت',
      'أعلى وأوسط وأسفل',
      'قبل وبعد',
      'تحديد الأنماط',
      'إنشاء الأنماط'
    ],
    goals:['يميز فوق وتحت','يميز أعلى وأوسط وأسفل','يفهم قبل وبعد','يكمل نمطًا بسيطًا','ينشئ نمطًا بسيطًا']
  },
  {
    id:'numbers-6-10',
    chapter:4,
    title:'الأعداد حتى 10',
    shortTitle:'6 إلى 10',
    symbol:'10',
    status:'ready',
    activityTypes:['count-select'],
    goals:['يعد عناصر مجموعة حتى 10','يربط الكمية بالعدد الصحيح حتى 10']
  },
  {
    id:'numbers-11-20',
    chapter:5,
    title:'الأعداد حتى 20',
    shortTitle:'11 إلى 20 • ترتيب',
    symbol:'20',
    status:'ready',
    activityTypes:['count-select','number-order'],
    goals:['يعد عناصر من 11 إلى 20','يربط الكمية بالعدد الصحيح حتى 20','يكمل ترتيبًا عدديًا بسيطًا ضمن 20']
  },
  {
    id:'addition-foundations',
    chapter:6,
    title:'الجمع',
    shortTitle:'جمع بصري ضمن 10',
    symbol:'+',
    status:'ready',
    activityTypes:['visual-addition'],
    goals:['يفهم ضم مجموعتين','يمثل قصة جمع بصريًا','يجد ناتج جمع بسيط ضمن 10']
  },
  {
    id:'subtraction-foundations',
    title:'الطرح',
    shortTitle:'الطرح',
    symbol:'−',
    status:'later',
    activityTypes:['visual-subtraction'],
    goals:['يفهم الأخذ من مجموعة','يجد ناتج طرح بسيط ضمن المهارات الأساسية']
  }
]);

export function getKhaledSkill(id){return KHALED_SKILLS.find(skill=>skill.id===id)||null;}
export function getReadyKhaledSkills(){return KHALED_SKILLS.filter(skill=>skill.status==='ready');}
