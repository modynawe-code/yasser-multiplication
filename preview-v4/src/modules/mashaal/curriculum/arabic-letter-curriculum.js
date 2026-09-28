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
  ['alif','ا','ألف','أَ',['أسد','أرنب','إبرة']],
  ['ba','ب','باء','بَ',['بطة','باب','بطيخ']],
  ['ta','ت','تاء','تَ',['تفاحة','تاج','تمر']],
  ['tha','ث','ثاء','ثَ',['ثعلب','ثوب','ثلج']],
  ['jim','ج','جيم','جَ',['جمل','جرس','جبل']],
  ['ha','ح','حاء','حَ',['حصان','حليب','حوت']],
  ['kha','خ','خاء','خَ',['خروف','خبز','خوخ']],
  ['dal','د','دال','دَ',['دجاجة','دب','دراجة']],
  ['thal','ذ','ذال','ذَ',['ذرة','ذئب','ذهب']],
  ['ra','ر','راء','رَ',['رمان','ريشة','رجل']],
  ['zay','ز','زاي','زَ',['زهرة','زرافة','زيت']],
  ['sin','س','سين','سَ',['سمكة','سيارة','ساعة']],
  ['shin','ش','شين','شَ',['شمس','شجرة','شمعة']],
  ['sad','ص','صاد','صَ',['صقر','صندوق','صابون']],
  ['dad','ض','ضاد','ضَ',['ضفدع','ضرس','ضوء']],
  ['taa','ط','طاء','طَ',['طائرة','طماطم','طبل']],
  ['zaa','ظ','ظاء','ظَ',['ظرف','ظل','ظبي']],
  ['ain','ع','عين','عَ',['عنب','عين','عصفور']],
  ['ghain','غ','غين','غَ',['غزال','غيمة','غراب']],
  ['fa','ف','فاء','فَ',['فراشة','فيل','فاكهة']],
  ['qaf','ق','قاف','قَ',['قمر','قلم','قطة']],
  ['kaf','ك','كاف','كَ',['كتاب','كرة','كرسي']],
  ['lam','ل','لام','لَ',['ليمون','لعبة','لؤلؤ']],
  ['mim','م','ميم','مَ',['موز','مفتاح','مدرسة']],
  ['nun','ن','نون','نَ',['نحلة','نجمة','نمر']],
  ['haa','هـ','هاء','هَ',['هلال','هدية','هاتف']],
  ['waw','و','واو','وَ',['وردة','وجه','ولد']],
  ['ya','ي','ياء','يَ',['يد','يمامة','ياسمين']]
];

export const MASHAAL_ARABIC_LETTERS=Object.freeze(LETTERS.map(([id,letter,name,sound,words],index)=>Object.freeze({
  id,letter,name,sound,order:index+1,words:Object.freeze(words)
})));

export function getMashaalArabicLetter(id){
  return MASHAAL_ARABIC_LETTERS.find(item=>item.id===String(id||''))||null;
}

export function getMashaalArabicSection(id){
  return MASHAAL_ARABIC_SECTIONS.find(item=>item.id===String(id||''))||null;
}
