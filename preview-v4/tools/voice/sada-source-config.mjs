export const SADA_SOURCE=Object.freeze({
  dataset:'m6011/sada2022',
  config:'default',
  split:'train',
  viewerApi:'https://datasets-server.huggingface.co',
  sourceUrl:'https://huggingface.co/datasets/m6011/sada2022',
  license:'CC BY-NC-SA 4.0'
});

export const SADA_FILTER=Object.freeze({
  SpeakerAge:'Adult -- بالغ',
  SpeakerGender:'Male',
  SpeakerDialect:'Najdi',
  SpeakerDialectFallbacks:Object.freeze(['Khaliji','Hijazi']),
  Environment:'Clean -- نظيف'
});

// Keep server-side filtering parser-safe. Bilingual values containing `--`
// are normalized and enforced locally.
export const SADA_SERVER_FILTER=Object.freeze({
  SpeakerGender:SADA_FILTER.SpeakerGender
});

function sqlString(value){return `'${String(value).replaceAll("'","''")}'`;}

export function sadaWhereClause(filter=SADA_SERVER_FILTER){
  return Object.entries(filter).map(([column,value])=>`"${column}"=${sqlString(value)}`).join(' AND ');
}

function numberOrZero(value){
  const parsed=Number(value);
  return Number.isFinite(parsed)?parsed:0;
}

function labelHead(value){
  return String(value||'').split('--',1)[0].trim().toLowerCase();
}

function sameLabel(value,expected){
  return labelHead(value)===labelHead(expected);
}

function dialectRank(value){
  const normalized=labelHead(value);
  const order=[SADA_FILTER.SpeakerDialect,...SADA_FILTER.SpeakerDialectFallbacks].map(labelHead);
  const index=order.indexOf(normalized);
  return index===-1?Number.POSITIVE_INFINITY:index;
}

function firstHttpUrl(value,seen=new Set()){
  if(value==null)return'';
  if(typeof value==='string')return /^https?:\/\//i.test(value.trim())?value.trim():'';
  if(typeof value!=='object'||seen.has(value))return'';
  seen.add(value);
  if(Array.isArray(value)){
    for(const item of value){const found=firstHttpUrl(item,seen);if(found)return found;}
    return'';
  }
  for(const key of ['src','url','download_url','downloadUrl']){
    const found=firstHttpUrl(value[key],seen);if(found)return found;
  }
  for(const nested of Object.values(value)){
    const found=firstHttpUrl(nested,seen);if(found)return found;
  }
  return'';
}

export function recordingIdFromSegmentId(segmentId=''){
  const value=String(segmentId||'').trim();
  if(!value)return'';
  const marker=value.indexOf('-seg_');
  return marker>0?value.slice(0,marker):value;
}

export function normalizeSadaRow(input={}){
  const row=input?.row&&typeof input.row==='object'?input.row:input;
  const segmentId=String(row?.SegmentID||'').trim();
  return Object.freeze({
    rowIndex:Number.isInteger(input?.row_idx)?input.row_idx:null,
    segmentId,
    recordingId:recordingIdFromSegmentId(segmentId),
    text:String(row?.ProcessedText||'').trim(),
    speaker:String(row?.Speaker||'').trim(),
    showName:String(row?.ShowName||'').trim(),
    speakerAge:String(row?.SpeakerAge||'').trim(),
    speakerGender:String(row?.SpeakerGender||'').trim(),
    speakerDialect:String(row?.SpeakerDialect||'').trim(),
    environment:String(row?.Environment||'').trim(),
    category:String(row?.Category||'').trim(),
    durationSeconds:numberOrZero(row?.SegmentLength),
    audioSrc:firstHttpUrl(row?.audio)
  });
}

export function isEligibleSadaRow(row,{minSeconds=.7,maxSeconds=14}={}){
  return Boolean(
    row&&
    sameLabel(row.speakerAge,SADA_FILTER.SpeakerAge)&&
    sameLabel(row.speakerGender,SADA_FILTER.SpeakerGender)&&
    Number.isFinite(dialectRank(row.speakerDialect))&&
    sameLabel(row.environment,SADA_FILTER.Environment)&&
    row.recordingId&&row.speaker&&row.audioSrc&&row.text&&
    row.durationSeconds>=minSeconds&&row.durationSeconds<=maxSeconds
  );
}

export function sadaSpeakerGroupKey(row){
  if(!row?.recordingId||!row?.speaker)return'';
  return `${row.recordingId}::${row.speaker}`;
}

export function rankSadaSpeakerGroups(rows,{minSeconds=.7,maxSeconds=14}={}){
  const groups=new Map();
  for(const input of rows||[]){
    const row=Object.isFrozen(input)?input:normalizeSadaRow(input);
    if(!isEligibleSadaRow(row,{minSeconds,maxSeconds}))continue;
    const key=sadaSpeakerGroupKey(row);
    const current=groups.get(key)||{key,recordingId:row.recordingId,speaker:row.speaker,showName:row.showName,speakerDialect:row.speakerDialect,rows:[],totalSeconds:0};
    current.rows.push(row);
    current.totalSeconds+=row.durationSeconds;
    groups.set(key,current);
  }
  return [...groups.values()].map(group=>Object.freeze({
    ...group,
    clipCount:group.rows.length,
    averageSeconds:group.rows.length?group.totalSeconds/group.rows.length:0,
    dialectRank:dialectRank(group.speakerDialect),
    score:group.totalSeconds+(Math.min(group.rows.length,40)*.15)
  })).sort((a,b)=>a.dialectRank-b.dialectRank||b.score-a.score||b.clipCount-a.clipCount||a.key.localeCompare(b.key,'en'));
}
