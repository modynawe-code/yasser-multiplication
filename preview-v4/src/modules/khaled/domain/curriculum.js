export const KHALED_CURRICULUM_META=Object.freeze({
  id:'sa-grade1-math-1448',
  grade:1,
  locale:'ar-SA',
  schoolYear:'1448-1449',
  verificationStatus:'core-skills-verified; exact current-book ordering remains independently verifiable'
});

export const KHALED_SKILLS=Object.freeze([
  {
    id:'classify-compare',
    title:'المقارنة والتصنيف',
    shortTitle:'أكثر وأقل',
    symbol:'◉',
    status:'ready',
    activityTypes:['compare-groups'],
    goals:['يميز المجموعة الأكثر','يميز المجموعة الأقل','يطابق الأشياء المتشابهة']
  },
  {
    id:'numbers-0-5',
    title:'الأعداد حتى 5',
    shortTitle:'0 إلى 5',
    symbol:'5',
    status:'ready',
    activityTypes:['count-select'],
    goals:['يعد عناصر مجموعة حتى 5','يربط الكمية بالعدد الصحيح']
  },
  {
    id:'position-pattern',
    title:'الموقع والنمط',
    shortTitle:'الأنماط',
    symbol:'◆',
    status:'planned',
    activityTypes:['pattern-next'],
    goals:['يكمل نمطًا بسيطًا','يميز الموقع بالنسبة للأشياء']
  },
  {
    id:'numbers-6-10',
    title:'الأعداد حتى 10',
    shortTitle:'6 إلى 10',
    symbol:'10',
    status:'planned',
    activityTypes:['count-select'],
    goals:['يعد عناصر مجموعة حتى 10','يرتب الأعداد حتى 10']
  },
  {
    id:'numbers-11-20',
    title:'الأعداد حتى 20',
    shortTitle:'11 إلى 20',
    symbol:'20',
    status:'planned',
    activityTypes:['count-select','number-order'],
    goals:['يعد ضمن 20','يقارن ويرتب أعدادًا ضمن 20']
  },
  {
    id:'addition-foundations',
    title:'الجمع',
    shortTitle:'الجمع',
    symbol:'+',
    status:'planned',
    activityTypes:['visual-addition'],
    goals:['يمثل قصة جمع بصريًا','يجد ناتج جمع بسيط']
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
