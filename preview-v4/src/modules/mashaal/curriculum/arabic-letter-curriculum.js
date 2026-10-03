import { getMashaalArabicImageItems } from './arabic-letter-image-bank.js';

export const MASHAAL_ARABIC_SECTIONS=Object.freeze([
  Object.freeze({id:'letters',title:'حروفي',subtitle:'أتعرف على الحروف',icon:'أ'}),
  Object.freeze({id:'write',title:'أكتب',subtitle:'أتتبع الحرف بإصبعي',icon:'✍️'}),
  Object.freeze({id:'color',title:'ألوّن',subtitle:'ألوّن الحرف وأتدرب',icon:'🎨'}),
  Object.freeze({id:'listen',title:'اسمع',subtitle:'أسمع اسم الحرف وأختاره',icon:'🔊'}),
  Object.freeze({id:'words',title:'كلماتي',subtitle:'صور وكلمات تبدأ بالحرف',icon:'💬'}),
  Object.freeze({id:'stories',title:'قصصي',subtitle:'قصص وترتيب أحداث',icon:'📖'}),
  Object.freeze({id:'games',title:'ألعابي',subtitle:'ألعاب الحروف والصور',icon:'🎮'})
]);

const LETTERS=[
  ['alif','ا','ألف'],['ba','ب','باء'],['ta','ت','تاء'],['tha','ث','ثاء'],
  ['jim','ج','جيم'],['ha','ح','حاء'],['kha','خ','خاء'],['dal','د','دال'],
  ['thal','ذ','ذال'],['ra','ر','راء'],['zay','ز','زاي'],['sin','س','سين'],
  ['shin','ش','شين'],['sad','ص','صاد'],['dad','ض','ضاد'],['taa','ط','طاء'],
  ['zaa','ظ','ظاء'],['ain','ع','عين'],['ghain','غ','غين'],['fa','ف','فاء'],
  ['qaf','ق','قاف'],['kaf','ك','كاف'],['lam','ل','لام'],['mim','م','ميم'],
  ['nun','ن','نون'],['haa','ه','هاء'],['waw','و','واو'],['ya','ي','ياء']
];

export const MASHAAL_ARABIC_LETTERS=Object.freeze(LETTERS.map(([id,letter,name],index)=>{
  const items=getMashaalArabicImageItems(id);
  return Object.freeze({
    id,letter,name,order:index+1,
    items,
    words:Object.freeze(items.map(item=>item.word)),
    exampleWord:items[0]?.word||''
  });
}));

export function getMashaalArabicLetter(id){
  return MASHAAL_ARABIC_LETTERS.find(item=>item.id===String(id||''))||null;
}

export function getMashaalArabicSection(id){
  return MASHAAL_ARABIC_SECTIONS.find(item=>item.id===String(id||''))||null;
}

export function getMashaalArabicLetterByWord(word){
  const value=String(word||'');
  return MASHAAL_ARABIC_LETTERS.find(item=>item.words.includes(value))||null;
}
