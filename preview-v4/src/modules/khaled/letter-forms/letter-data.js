// Connection state is derived from neighbours, never from word position alone.
const RIGHT_ONLY=new Set('ادذرزواأإآؤىة');
const NON_JOINING=new Set('ء');
export const FORM_LABELS={isolated:'منفصل',initial:'متصل بما بعده',medial:'متصل من الجهتين',final:'متصل بما قبله'};
const rows=[
 ['ا','الألف','alif','اسم باب عصا','فأر'],['ب','الباء','ba','باب حبل كتاب كلب','حقيبة'],
 ['ت','التاء','ta','تمر كتاب بيت نبات','مفتاح'],['ث','الثاء','tha','ثعلب مثلث بحث أثاث','كمثرى'],
 ['ج','الجيم','jim','جمل شجرة ثلج تاج','نجوم'],['ح','الحاء','ha','حبل بحر ملح تفاح','سلحفاة'],
 ['خ','الخاء','kha','خبز نخلة بطيخ صاروخ','نخلة'],['د','الدال','dal','دب مدرسة يد','هدية'],
 ['ذ','الذال','thal','ذرة بذرة لذيذ','حذاء'],['ر','الراء','ra','رمل كرسي قمر','خروف'],
 ['ز','الزاي','zay','زر مزرعة خبز','جزر'],['س','السين','sin','سمك مسجد شمس رأس','تمساح'],
 ['ش','الشين','shin','شمس مشمش ريش فراش','خشب'],['ص','الصاد','sad','صباح عصفور قفص قرص أصفر','مصعد'],
 ['ض','الضاد','dad','ضفدع خضار بيض أرض','خضار'],['ط','الطاء','taa','طبل مطر خيط بساط','مطرقة'],
 ['ظ','الظاء','zaa','ظرف عظم حفظ ألفاظ','مظلة'],['ع','العين','ain','عين ملعب شمع ذراع','ملعقة'],
 ['غ','الغين','ghain','غزال مغرب صبغ فراغ','ببغاء'],['ف','الفاء','fa','فيل مفتاح صوف كتف','سلحفاة'],
 ['ق','القاف','qaf','قمر بقرة طبق برق','بقرة'],['ك','الكاف','kaf','كتاب مكتب سمك شباك','سمكة'],
 ['ل','اللام','lam','ليمون قلم جبل غزال','علم'],['م','الميم','mim','موز قمر علم طعام','شمس'],
 ['ن','النون','nun','نمر عنب حصان لبن','عنب'],['ه','الهاء','haa','هلال نهر وجه مياه','كهف'],
 ['و','الواو','waw','ورد موز دلو','عصفور'],['ي','الياء','ya','يد بيت كرسي شاي','سيارة']
];
export const LETTERS=Object.freeze(rows.map(([char,name,audio,words,videoWord])=>Object.freeze({char,name,audio,words:words.split(' '),videoWord,dual:!RIGHT_ONLY.has(char)})));
export function connectionAt(word,index){
 const chars=Array.from(word.replace(/[\u064b-\u065f\u0670\u0640]/g,''));
 const char=chars[index],previous=chars[index-1],next=chars[index+1];
 const valid=c=>!!c&&/[\u0621-\u064a]/.test(c)&&!NON_JOINING.has(c);
 const before=valid(previous)&&valid(char)&&!RIGHT_ONLY.has(previous);
 const after=valid(char)&&valid(next)&&!RIGHT_ONLY.has(char);
 return {before,after,form:before?(after?'medial':'final'):(after?'initial':'isolated'),position:index===0?'أول الكلمة':index===chars.length-1?'آخر الكلمة':'وسط الكلمة'};
}
export function formText(char,form){return `${form==='final'||form==='medial'?'ـ':''}${char}${form==='initial'||form==='medial'?'ـ':''}`;}
export function examplesFor(letter){
 const result=[];
 for(const word of letter.words)Array.from(word).forEach((char,index)=>{if(char===letter.char)result.push({word,index,...connectionAt(word,index)});});
 return result;
}
export function availableForms(letter){return letter.dual?['isolated','initial','medial','final']:['isolated','final'];}

export const STORAGE_KEY='family.khaled.letter-forms.v1';
export function loadProgress(storage){
 try{
  const value=JSON.parse(storage.getItem(STORAGE_KEY)||'null');
  if(value?.version!==1)return {version:1,last:'ا',letters:{},drafts:{}};
  const isObject=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const letters={};
  for(const l of LETTERS){
   const old=value.letters?.[l.char];if(!isObject(old))continue;
   const entry={lastQuestion:Number.isInteger(old.lastQuestion)&&old.lastQuestion>=-1?old.lastQuestion:-1};
   for(const kind of ['writing','independent','assisted'])if(isObject(old[kind]))entry[kind]=Object.fromEntries(Object.entries(old[kind]).filter(([key,v])=>v===true&&(kind!=='writing'||availableForms(l).includes(key))));
   letters[l.char]=entry;
  }
  return {version:1,last:LETTERS.some(l=>l.char===value.last)?value.last:'ا',letters,drafts:isObject(value.drafts)?value.drafts:{},lesson:value.lesson};
 }catch{return {version:1,last:'ا',letters:{},drafts:{}};}
}
