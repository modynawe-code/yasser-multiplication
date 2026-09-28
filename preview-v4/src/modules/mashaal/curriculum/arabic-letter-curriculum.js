export const MASHAAL_ARABIC_SECTIONS=Object.freeze([
  Object.freeze({id:'letters',title:'حروفي',subtitle:'أتعرف على الحروف',icon:'أ'}),
  Object.freeze({id:'write',title:'أكتب',subtitle:'أتتبع الحرف بإصبعي',icon:'✍️'}),
  Object.freeze({id:'color',title:'ألوّن',subtitle:'أختار لون الحرف',icon:'🎨'}),
  Object.freeze({id:'listen',title:'اسمع',subtitle:'أسمع وأختار الحرف',icon:'🔊'}),
  Object.freeze({id:'words',title:'كلماتي',subtitle:'كلمات تبدأ بالحرف',icon:'💬'}),
  Object.freeze({id:'stories',title:'قصصي',subtitle:'قصص وترتيب أحداث',icon:'📖'}),
  Object.freeze({id:'games',title:'ألعابي',subtitle:'ألعاب العربية',icon:'🎮'})
]);

const LETTERS=[
  ['alif','ا','ألف',['أسد','أرنب','إبرة']],
  ['ba','ب','باء',['بطة','باب','بطيخ']],
  ['ta','ت','تاء',['تفاحة','تاج','تمر']],
  ['tha','ث','ثاء',['ثعلب','ثوب','ثلج']],
  ['jim','ج','جيم',['جمل','جرس','جبل']],
  ['ha','ح','حاء',['حصان','حليب','حوت']],
  ['kha','خ','خاء',['خروف','خبز','خوخ']],
  ['dal','د','دال',['دجاجة','دب','دراجة']],
  ['thal','ذ','ذال',['ذرة','ذئب','ذهب']],
  ['ra','ر','راء',['رمان','ريشة','رجل']],
  ['zay','ز','زاي',['زهرة','زرافة','زيت']],
  ['sin','س','سين',['سمكة','سيارة','ساعة']],
  ['shin','ش','شين',['شمس','شجرة','شمعة']],
  ['sad','ص','صاد',['صقر','صندوق','صابون']],
  ['dad','ض','ضاد',['ضفدع','ضرس','ضوء']],
  ['taa','ط','طاء',['طائرة','طماطم','طبل']],
  ['zaa','ظ','ظاء',['ظرف','ظل','ظبي']],
  ['ain','ع','عين',['عنب','عين','عصفور']],
  ['ghain','غ','غين',['غزال','غيمة','غراب']],
  ['fa','ف','فاء',['فراشة','فيل','فاكهة']],
  ['qaf','ق','قاف',['قمر','قلم','قطة']],
  ['kaf','ك','كاف',['كتاب','كرة','كرسي']],
  ['lam','ل','لام',['ليمون','لعبة','لؤلؤ']],
  ['mim','م','ميم',['موز','مفتاح','مدرسة']],
  ['nun','ن','نون',['نحلة','نجمة','نمر']],
  ['haa','ه','هاء',['هلال','هدية','هاتف']],
  ['waw','و','واو',['وردة','وجه','ولد']],
  ['ya','ي','ياء',['يد','يمامة','ياسمين']]
];

export const MASHAAL_ARABIC_LETTERS=Object.freeze(LETTERS.map(([id,letter,name,words],index)=>Object.freeze({
  id,letter,name,order:index+1,words:Object.freeze(words),exampleWord:words[0]
})));

export function getMashaalArabicLetter(id){
  return MASHAAL_ARABIC_LETTERS.find(item=>item.id===String(id||''))||null;
}

export function getMashaalArabicSection(id){
  return MASHAAL_ARABIC_SECTIONS.find(item=>item.id===String(id||''))||null;
}
