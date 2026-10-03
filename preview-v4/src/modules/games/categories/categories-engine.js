export const FAMILY_WORD_CATEGORIES=Object.freeze([
  Object.freeze({id:'person',label:'اسم إنسان',icon:'👤'}),
  Object.freeze({id:'animal',label:'حيوان',icon:'🐾'}),
  Object.freeze({id:'plant',label:'نبات',icon:'🌿'}),
  Object.freeze({id:'object',label:'جماد',icon:'📦'}),
  Object.freeze({id:'country',label:'بلد',icon:'🌍'})
]);

export const FAMILY_WORD_LETTERS=Object.freeze([
  'ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'
]);

const DIACRITICS=/[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_WORD=/[^\u0621-\u063A\u0641-\u064A0-9]+/g;
const SPEED_BONUS=Object.freeze([5,3,1]);

export function normalizeArabicAnswer(value){
  return String(value||'')
    .trim()
    .replace(/ـ/g,'')
    .replace(DIACRITICS,'')
    .replace(/[أإآٱ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي')
    .replace(NON_WORD,'')
    .toLowerCase();
}

function comparableArabicAnswer(value){
  const normalized=normalizeArabicAnswer(value);
  return normalized.startsWith('ال')&&normalized.length>2?normalized.slice(2):normalized;
}

export function answerStartsWithLetter(answer,letter){
  const normalized=normalizeArabicAnswer(answer),comparable=comparableArabicAnswer(answer),target=normalizeArabicAnswer(letter);
  return Boolean(normalized&&target&&(normalized.startsWith(target)||comparable.startsWith(target)));
}

export function validateAnswerSheet({answers={},letter,categories=FAMILY_WORD_CATEGORIES}={}){
  const issues=[];
  for(const category of categories){
    const value=String(answers?.[category.id]||'').trim();
    if(!value){issues.push(Object.freeze({categoryId:category.id,reason:'empty'}));continue;}
    if(!answerStartsWithLetter(value,letter))issues.push(Object.freeze({categoryId:category.id,reason:'wrong-letter'}));
  }
  return Object.freeze({ok:issues.length===0,issues:Object.freeze(issues)});
}

export function chooseRoundLetter({usedLetters=[],random=Math.random,letters=FAMILY_WORD_LETTERS}={}){
  const used=new Set((usedLetters||[]).map(normalizeArabicAnswer)),available=letters.filter(letter=>!used.has(normalizeArabicAnswer(letter)));
  const pool=available.length?available:letters;
  if(!pool.length)throw new TypeError('letters are required');
  const n=Number(random?.()??0),safe=Number.isFinite(n)?Math.min(.999999,Math.max(0,n)):0;
  return pool[Math.floor(safe*pool.length)];
}

function verdictAccepted(verdicts,playerId,categoryId){
  const value=verdicts?.[playerId]?.[categoryId];
  return value!==false;
}

export function scoreWordRound({players=[],answersByPlayer={},verdictsByPlayer={},finishMsByPlayer={},letter,categories=FAMILY_WORD_CATEGORIES}={}){
  const ids=players.map(player=>String(player?.id||player)).filter(Boolean);
  const result=Object.fromEntries(ids.map(id=>[id,{playerId:id,baseScore:0,speedBonus:0,total:0,validCount:0,invalidCount:0,finishMs:Number(finishMsByPlayer?.[id]??Infinity),categories:{}}]));

  for(const category of categories){
    const accepted=[];
    for(const id of ids){
      const answer=String(answersByPlayer?.[id]?.[category.id]||'').trim();
      const valid=Boolean(answer&&answerStartsWithLetter(answer,letter)&&verdictAccepted(verdictsByPlayer,id,category.id));
      const normalized=valid?comparableArabicAnswer(answer):'';
      result[id].categories[category.id]={answer,valid,normalized,score:0};
      if(valid)accepted.push({id,normalized});
    }
    const counts=new Map();
    accepted.forEach(item=>counts.set(item.normalized,(counts.get(item.normalized)||0)+1));
    for(const id of ids){
      const item=result[id].categories[category.id];
      if(!item.valid){result[id].invalidCount+=1;continue;}
      item.score=(counts.get(item.normalized)||0)>1?5:10;
      result[id].baseScore+=item.score;result[id].validCount+=1;
    }
  }

  const perfect=ids
    .filter(id=>result[id].invalidCount===0&&Number.isFinite(result[id].finishMs))
    .sort((a,b)=>result[a].finishMs-result[b].finishMs||ids.indexOf(a)-ids.indexOf(b));
  perfect.slice(0,SPEED_BONUS.length).forEach((id,index)=>{result[id].speedBonus=SPEED_BONUS[index];});
  ids.forEach(id=>{result[id].total=result[id].baseScore+result[id].speedBonus;Object.freeze(result[id].categories);Object.freeze(result[id]);});

  const ranking=ids.slice().sort((a,b)=>result[b].total-result[a].total||result[b].baseScore-result[a].baseScore||result[a].finishMs-result[b].finishMs||ids.indexOf(a)-ids.indexOf(b));
  return Object.freeze({scores:Object.freeze(result),ranking:Object.freeze(ranking)});
}

export function cumulativeScore(roundResults=[],players=[]){
  const ids=players.map(player=>String(player?.id||player)).filter(Boolean),totals=Object.fromEntries(ids.map(id=>[id,0])),wins=Object.fromEntries(ids.map(id=>[id,0]));
  for(const round of roundResults){
    ids.forEach(id=>{totals[id]+=Number(round?.scores?.[id]?.total||0);});
    const winner=round?.ranking?.[0];if(winner&&ids.includes(winner))wins[winner]+=1;
  }
  const ranking=ids.slice().sort((a,b)=>totals[b]-totals[a]||wins[b]-wins[a]||ids.indexOf(a)-ids.indexOf(b));
  return Object.freeze({totals:Object.freeze(totals),wins:Object.freeze(wins),ranking:Object.freeze(ranking)});
}
