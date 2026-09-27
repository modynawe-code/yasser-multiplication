const LABELS=Object.freeze({
  star:'نجمة',ball:'كرة',heart:'قلب',door:'باب',duck:'بطة',apple:'تفاحة',moon:'قمر',circle:'دائرة',square:'مربع',box:'صندوق',
  'red-circle':'دائرة حمراء','blue-circle':'دائرة زرقاء','red-square':'مربع أحمر','yellow-square':'مربع أصفر',wake:'استيقاظ','brush-teeth':'تنظيف الأسنان',breakfast:'فطور',umbrella:'مظلة',sunglasses:'نظارة شمسية',done:'تم',
  happy:'فرحانة',sad:'حزينة',angry:'زعلانة','wait-turn':'أنتظر دوري','grab-ball':'آخذ الكرة','walk-away-angry':'أبتعد وأنا غاضبة',
  'ask-help':'أطلب المساعدة','throw-blocks':'أرمي المكعبات','kick-blocks':'أركل المكعبات','wet-hands':'أبلل يدي','soap':'أستخدم الصابون','rub-hands':'أفرك يدي','rinse-hands':'أشطف يدي',
  'stay-away':'أبتعد','touch-hot':'ألمس','play-near-hot':'ألعب قربه','return-book':'أرجع الكتاب','leave-book-floor':'أتركه على الأرض','damage-book':'أتلفه',
  'help-tidy':'أساعد في الترتيب','leave-mess':'أترك المكان','scatter-toys':'أنثر الألعاب','saudi-flag':'علم السعودية','japan-flag':'علم اليابان','brazil-flag':'علم البرازيل',
  doctor:'طبيب',teacher:'معلمة',baker:'خباز',left:'هذه المجموعة',right:'هذه المجموعة','ball-above-box':'الكرة فوق الصندوق','ball-inside-box':'الكرة داخل الصندوق','ball-below-box':'الكرة تحت الصندوق',seed:'بذرة',sprout:'نبتة صغيرة',plant:'نبتة كبيرة',bird:'عصفور',cat:'قطة',pond:'بركة',nest:'عش',home:'بيت',red:'أحمر',yellow:'أصفر',blue:'أزرق',orange:'برتقالي'
});

const tokenLabel=(token)=>LABELS[token]||String(token);

function stimulusModel(stimulus={}){
  switch(stimulus.kind){
    case 'ordered-actions':return {kind:'ordered-actions',items:[...(stimulus.actions||[])]};
    case 'initial-sound':return {kind:'sound',sound:stimulus.sound||''};
    case 'letter-sound':return {kind:'sound',sound:stimulus.sound||''};
    case 'countable-set':return {kind:'items',item:stimulus.item||'circle',count:stimulus.count||0};
    case 'group-comparison':return {kind:'groups',leftCount:stimulus.leftCount||0,rightCount:stimulus.rightCount||0,item:stimulus.item||'circle'};
    case 'attribute-sort':return {kind:'sort',attribute:stimulus.attribute||'',target:stimulus.target||''};
    case 'pattern':return {kind:'sequence',items:[...(stimulus.sequence||[])]};
    case 'spatial-relation':return {kind:'relation',relation:stimulus.relation||'',subject:stimulus.subject||'',reference:stimulus.reference||''};
    case 'picture-scene':return {kind:'picture',scene:stimulus.scene||''};
    case 'trace-path':return {kind:'trace',path:stimulus.path||'wave'};
    case 'memory':return {kind:'memory',items:[...(stimulus.items||[])]};
    case 'letter-hunt':return {kind:'letter-hunt',sound:stimulus.sound||'',items:[...(stimulus.items||[])],targets:[...(stimulus.targets||[])]};
    case 'kitchen-count':return {kind:'kitchen-count',item:stimulus.item||'apple',count:Number(stimulus.count)||0,available:Number(stimulus.available)||0};
    case 'animal-habitat':return {kind:'animal-habitat',animals:[...(stimulus.animals||[])],habitats:[...(stimulus.habitats||[])],pairs:{...(stimulus.pairs||{})}};
    case 'color-mix':return {kind:'color-mix',colors:[...(stimulus.colors||[])],target:stimulus.target||'',correctPair:[...(stimulus.correctPair||[])]};
    case 'interactive-story':return {kind:'interactive-story',steps:(stimulus.steps||[]).map(step=>Object.freeze({scene:String(step.scene||''),promptAr:String(step.promptAr||''),audioPromptAr:String(step.audioPromptAr||step.promptAr||''),choices:[...(step.choices||[])],correctChoice:String(step.correctChoice||'')}))};
    case 'grid-maze':return {kind:'grid-maze',animal:String(stimulus.animal||'duck'),goal:String(stimulus.goal||'pond'),size:Number(stimulus.size)||5,start:[...(stimulus.start||[0,0])],finish:[...(stimulus.finish||[4,4])],walls:[...(stimulus.walls||[])]};
    case 'picture-puzzle':return {kind:'picture-puzzle',imagePath:String(stimulus.imagePath||''),rows:Math.max(2,Number(stimulus.rows)||2),cols:Math.max(2,Number(stimulus.cols)||2)};
    case 'emotion-prompt':return {kind:'emotion-prompt'};
    case 'movement':return {kind:'movement',movement:stimulus.movement||''};
    case 'fine-motor':return {kind:'fine-motor',task:stimulus.task||''};
    case 'recitation-audio':return {kind:'recitation',surahNameAr:stimulus.surahNameAr||'تلاوة قصيرة',surahNumber:stimulus.surahNumber||null};
    default:return {kind:'text'};
  }
}

export function createMashaalActivityViewModel(activity){
  if(!activity)return null;
  const orderedSequence=activity.stimulus?.kind==='ordered-actions',multiSelect=activity.interaction==='sorting',completionOnly=activity.evidenceType==='activity-completion',requiresHumanRecitation=activity.stimulus?.kind==='recitation-audio';
  return Object.freeze({
    id:activity.id,
    skillId:activity.skillId,
    interaction:activity.interaction,
    activityType:activity.activityType,
    evidenceType:activity.evidenceType,
    promptAr:activity.promptAr,
    audioPromptAr:activity.audioPromptAr,
    experienceTitleAr:activity.experienceTitleAr||'',
    stimulus:Object.freeze(stimulusModel(activity.stimulus)),
    choices:Object.freeze((activity.choices||[]).map(value=>Object.freeze({value,label:tokenLabel(value),visualKey:String(value)}))),
    multiSelect,
    orderedSequence,
    completionOnly,
    requiresHumanRecitation,
    recitationAudioPath:requiresHumanRecitation?activity.mediaPath:null,
    recitationMushafPage:requiresHumanRecitation&&activity.mushafPage?Object.freeze({...activity.mushafPage}):null,
    correctValues:Object.freeze(completionOnly?[]:orderedSequence?[...(activity.stimulus?.actions||[])]:multiSelect?String(activity.correctChoice||'').split('|').filter(Boolean):[String(activity.correctChoice||'')])
  });
}

export function isMashaalActivityAnswerCorrect(viewModel,answer){
  if(!viewModel||viewModel.completionOnly)return false;
  const expected=[...viewModel.correctValues],received=(Array.isArray(answer)?answer:[answer]).map(String);
  if(viewModel.orderedSequence)return expected.length===received.length&&expected.every((value,index)=>value===received[index]);
  expected.sort();received.sort();return expected.length===received.length&&expected.every((value,index)=>value===received[index]);
}
