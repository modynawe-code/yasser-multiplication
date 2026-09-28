const STORAGE_KEY='family-learning:mashaal:arabic-progress:v1';

function emptyLetter(){
  return {views:0,attempts:0,correct:0,writingChecks:0,writingSuccess:0,wordWins:0,gameWins:0,updatedAt:0};
}
function safeParse(raw){
  try{
    const value=JSON.parse(raw);
    return value&&typeof value==='object'?value:{};
  }catch{return {};}
}
function normalizeLetter(value){
  return {...emptyLetter(),...(value&&typeof value==='object'?value:{})};
}
function resolveStorage(storage){
  if(storage)return storage;
  try{return globalThis.localStorage||null;}catch{return null;}
}

export function createMashaalArabicProgress({storage}={}){
  const target=resolveStorage(storage);
  function load(){
    const raw=target?.getItem?.(STORAGE_KEY);
    const parsed=safeParse(raw);
    return {version:1,letters:{...(parsed.letters||{})}};
  }
  function save(state){
    try{target?.setItem?.(STORAGE_KEY,JSON.stringify(state));}catch{}
    return state;
  }
  function get(letterId){
    const state=load();
    return normalizeLetter(state.letters[String(letterId||'')]);
  }
  function record(letterId,event,{correct=true}={}){
    const id=String(letterId||'');
    if(!id)return get(id);
    const state=load(),entry=normalizeLetter(state.letters[id]);
    if(event==='view')entry.views+=1;
    if(event==='attempt'){entry.attempts+=1;if(correct)entry.correct+=1;}
    if(event==='writing'){entry.writingChecks+=1;if(correct)entry.writingSuccess+=1;}
    if(event==='word')entry.wordWins+=correct?1:0;
    if(event==='game'){entry.attempts+=1;if(correct){entry.correct+=1;entry.gameWins+=1;}}
    entry.updatedAt=Date.now();
    state.letters[id]=entry;save(state);return entry;
  }
  function status(letterId){
    const entry=get(letterId);
    const mastered=entry.correct>=6&&entry.gameWins>=3&&entry.writingSuccess>=1&&entry.wordWins>=1;
    const learning=!mastered&&(entry.views>0||entry.attempts>0||entry.writingChecks>0||entry.wordWins>0);
    return mastered?'mastered':learning?'learning':'new';
  }
  function summary(letterIds=[]){
    const ids=[...letterIds],counts={mastered:0,learning:0,new:0};
    for(const id of ids)counts[status(id)]+=1;
    return Object.freeze({...counts,total:ids.length});
  }
  function reset(){
    try{target?.removeItem?.(STORAGE_KEY);}catch{}
  }
  return Object.freeze({get,record,status,summary,reset,key:STORAGE_KEY});
}

export { STORAGE_KEY as MASHAAL_ARABIC_PROGRESS_STORAGE_KEY };
