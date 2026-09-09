import { getMashaalWebMedia } from './mashaal-web-media.js';

const STYLE_KEY='mashaal-web-media';
function ensureWebMediaStyle(){
  if(document.querySelector(`link[data-module-style="${STYLE_KEY}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/mashaal/ui/mashaal-web-media.css';
  link.dataset.moduleStyle=STYLE_KEY;
  document.head.appendChild(link);
}

const DOMAIN_ART=Object.freeze({
  'language-communication':'assets/mashaal/domains/language.webp',
  'cognitive-operations-general-knowledge':'assets/mashaal/domains/thinking.webp',
  'social-emotional-development':'assets/mashaal/domains/feelings.webp',
  'health-physical-development':'assets/mashaal/domains/health.webp',
  'quran-islamic-education':'assets/mashaal/domains/quran.webp',
  'national-social-studies':'assets/mashaal/domains/community.webp'
});

const SCENE_ART=Object.freeze({
  'girl-drinking-water':DOMAIN_ART['health-physical-development'],
  'rainy-day':DOMAIN_ART['health-physical-development'],
  'girl-lost-toy':DOMAIN_ART['social-emotional-development'],
  'two-children-one-ball':DOMAIN_ART['social-emotional-development'],
  'fallen-block-tower':DOMAIN_ART['cognitive-operations-general-knowledge'],
  'hot-surface':DOMAIN_ART['health-physical-development'],
  'borrowed-book':DOMAIN_ART['language-communication'],
  'playtime-cleanup':DOMAIN_ART['national-social-studies'],
  flags:DOMAIN_ART['national-social-studies'],
  clinic:DOMAIN_ART['national-social-studies']
});

const SIMPLE_VISUALS=new Set([
  'star','ball','heart','door','duck','apple','moon','circle','square','box','red-circle','blue-circle','red-square','yellow-square',
  'wake','brush-teeth','breakfast','umbrella','sunglasses','happy','sad','angry','wait-turn','grab-ball','walk-away-angry','ask-help','throw-blocks','kick-blocks',
  'wet-hands','soap','rub-hands','rinse-hands','stay-away','touch-hot','play-near-hot','return-book','leave-book-floor','damage-book','help-tidy','leave-mess','scatter-toys',
  'saudi-flag','japan-flag','brazil-flag','doctor','teacher','baker','hospital','school','bakery','car','airplane','boat',
  'ball-above-box','ball-inside-box','ball-below-box','done','balance','fine-motor'
]);

export function getMashaalDomainArt(domainId){return DOMAIN_ART[domainId]||DOMAIN_ART['cognitive-operations-general-knowledge'];}

export function createMashaalDomainArt(domainId,{className=''}={}){
  ensureWebMediaStyle();
  const img=document.createElement('img');
  img.className=['mashaal-illustration',className].filter(Boolean).join(' ');
  img.src=getMashaalDomainArt(domainId);
  img.alt='';
  img.decoding='async';
  img.loading='eager';
  img.draggable=false;
  img.setAttribute('aria-hidden','true');
  return img;
}

function simpleVisual(key,{compact=false}={}){
  const visual=document.createElement('span');
  visual.className=`mashaal-visual mashaal-visual-${compact?'compact':'large'}`;
  visual.dataset.visual=SIMPLE_VISUALS.has(key)?key:'generic';
  visual.setAttribute('aria-hidden','true');
  return visual;
}

function mediaVisual(key,media,{compact=false}={}){
  ensureWebMediaStyle();
  const host=document.createElement('span');
  host.className=`mashaal-media-visual${compact?' compact':''}`;
  host.dataset.mediaKind=key.endsWith('-flag')?'flag':'illustration';
  host.setAttribute('aria-hidden','true');
  const img=document.createElement('img');
  img.src=media.url;
  img.alt='';
  img.decoding='async';
  img.loading='eager';
  img.referrerPolicy='no-referrer';
  img.draggable=false;
  img.addEventListener('error',()=>{host.replaceChildren(simpleVisual(key,{compact}));},{once:true});
  host.appendChild(img);
  return host;
}

function illustratedGroupVisual(count,item,{compact=false}={}){
  if(item!=='apple')return null;
  const media=getMashaalWebMedia(`compare-${count}-apples`);
  return media?mediaVisual(`compare-${count}-apples`,media,{compact}):null;
}

export function createMashaalChoiceVisual(key,viewModel,{compact=false}={}){
  if((key==='left'||key==='right')&&viewModel?.stimulus?.kind==='groups'){
    const count=key==='left'?viewModel.stimulus.leftCount:viewModel.stimulus.rightCount;
    const item=viewModel.stimulus.item||'circle';
    return illustratedGroupVisual(count,item,{compact})||createCountGroupVisual(count,{compact,item});
  }
  const media=getMashaalWebMedia(key);
  if(media)return mediaVisual(String(key),media,{compact});
  if(/^\d+$/.test(String(key))){
    const number=document.createElement('span');number.className=`mashaal-number-visual ${compact?'compact':''}`;number.textContent=String(key);number.setAttribute('aria-hidden','true');return number;
  }
  if(/^[\u0621-\u064A]$/.test(String(key))){
    const letter=document.createElement('span');letter.className=`mashaal-letter-visual ${compact?'compact':''}`;letter.textContent=String(key);letter.setAttribute('aria-hidden','true');return letter;
  }
  return simpleVisual(String(key),{compact});
}

export function createCountGroupVisual(count,{compact=false,item='circle'}={}){
  const group=document.createElement('span');group.className=`mashaal-count-group ${compact?'compact':''}`;group.setAttribute('aria-hidden','true');
  for(let index=0;index<Math.max(0,Number(count)||0);index++)group.appendChild(createMashaalChoiceVisual(item,null,{compact:true}));
  return group;
}

export function createMashaalStimulusVisual(stimulus,{domainId=null,compact=false}={}){
  const host=document.createElement('div');host.className=`mashaal-generated-stimulus ${compact?'compact':''}`;host.setAttribute('aria-hidden','true');
  if(!stimulus)return host;
  if(stimulus.kind==='picture'){
    const img=document.createElement('img');img.className='mashaal-scene-art';img.src=SCENE_ART[stimulus.scene]||getMashaalDomainArt(domainId);img.alt='';img.decoding='async';img.draggable=false;host.appendChild(img);return host;
  }
  if(stimulus.kind==='items'){
    host.appendChild(createCountGroupVisual(stimulus.count,{compact,item:stimulus.item||'circle'}));return host;
  }
  if(stimulus.kind==='groups'){
    const pair=document.createElement('div');pair.className='mashaal-group-pair';
    pair.append(
      illustratedGroupVisual(stimulus.leftCount,stimulus.item,{compact})||createCountGroupVisual(stimulus.leftCount,{compact,item:stimulus.item||'circle'}),
      illustratedGroupVisual(stimulus.rightCount,stimulus.item,{compact})||createCountGroupVisual(stimulus.rightCount,{compact,item:stimulus.item||'circle'})
    );
    host.appendChild(pair);return host;
  }
  if(stimulus.kind==='sequence'||stimulus.kind==='ordered-actions'){
    const row=document.createElement('div');row.className='mashaal-visual-sequence';for(const item of stimulus.items||[])row.appendChild(createMashaalChoiceVisual(item,null,{compact:true}));host.appendChild(row);return host;
  }
  if(stimulus.kind==='sound'){
    const bubble=document.createElement('span');bubble.className='mashaal-sound-visual';bubble.textContent=stimulus.sound||'';host.appendChild(bubble);return host;
  }
  if(stimulus.kind==='relation'){
    const key=stimulus.relation==='above'?'ball-above-box':stimulus.relation==='below'?'ball-below-box':'ball-inside-box';host.appendChild(simpleVisual(key,{compact}));return host;
  }
  if(stimulus.kind==='trace'){
    const trace=document.createElement('span');trace.className='mashaal-trace-visual';trace.innerHTML='<i></i><b></b>';host.appendChild(trace);return host;
  }
  if(stimulus.kind==='emotion-prompt'){
    const row=document.createElement('div');row.className='mashaal-visual-sequence';for(const key of ['happy','sad','angry'])row.appendChild(createMashaalChoiceVisual(key,null,{compact:true}));host.appendChild(row);return host;
  }
  if(stimulus.kind==='movement'){
    host.appendChild(simpleVisual('balance',{compact}));return host;
  }
  if(stimulus.kind==='fine-motor'){
    host.appendChild(simpleVisual('fine-motor',{compact}));return host;
  }
  const fallback=createMashaalDomainArt(domainId,{className:'mashaal-scene-art'});host.appendChild(fallback);return host;
}
