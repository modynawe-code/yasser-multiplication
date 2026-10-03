import { getMashaalArabicImageItems } from './arabic-letter-image-bank.js';

function scene(letterId,itemIndex,text){
  const item=getMashaalArabicImageItems(letterId)[itemIndex];
  return Object.freeze({word:item.word,image:item.image,text});
}

export const MASHAAL_ARABIC_MINI_STORIES=Object.freeze([
  Object.freeze({
    id:'ba-door-duck-watermelon',letterId:'ba',title:'الباب والبطة والبطيخ',
    scenes:Object.freeze([
      scene('ba',1,'فتحنا الباب في الصباح.'),
      scene('ba',0,'خرجت بطة صغيرة إلى الحديقة.'),
      scene('ba',2,'وجدت البطة بطيخًا كبيرًا.')
    ])
  }),
  Object.freeze({
    id:'shin-sun-tree-candle',letterId:'shin',title:'من الشمس إلى المساء',
    scenes:Object.freeze([
      scene('shin',0,'أشرقت الشمس في الصباح.'),
      scene('shin',1,'جلست مشاعل قرب الشجرة.'),
      scene('shin',2,'وفي المساء أضاءت شمعة.')
    ])
  }),
  Object.freeze({
    id:'mim-school-key-banana',letterId:'mim',title:'يوم في المدرسة',
    scenes:Object.freeze([
      scene('mim',2,'وصلت مشاعل إلى المدرسة.'),
      scene('mim',1,'وجدت مفتاح حقيبتها.'),
      scene('mim',0,'وأكلت موزة في الاستراحة.')
    ])
  }),
  Object.freeze({
    id:'qaf-cat-pencil-moon',letterId:'qaf',title:'القطة والقلم والقمر',
    scenes:Object.freeze([
      scene('qaf',2,'رأت مشاعل قطة لطيفة.'),
      scene('qaf',1,'رسمت القطة بالقلم.'),
      scene('qaf',0,'ثم ظهر القمر في السماء.')
    ])
  }),
  Object.freeze({
    id:'sin-car-clock-fish',letterId:'sin',title:'رحلة إلى البحر',
    scenes:Object.freeze([
      scene('sin',1,'ركبت العائلة السيارة إلى البحر.'),
      scene('sin',2,'نظرت مشاعل إلى الساعة.'),
      scene('sin',0,'وعند البحر شاهدت سمكة.')
    ])
  }),
  Object.freeze({
    id:'ta-apple-crown-crocodile',letterId:'ta',title:'تفاحة وتاج وتمساح',
    scenes:Object.freeze([
      scene('ta',0,'وجدت مشاعل تفاحة حمراء.'),
      scene('ta',1,'ثم رأت تاجًا لامعًا.'),
      scene('ta',2,'وبعيدًا شاهدت تمساحًا.')
    ])
  })
]);

export function getMashaalArabicMiniStory(id){
  return MASHAAL_ARABIC_MINI_STORIES.find(item=>item.id===String(id||''))||null;
}
