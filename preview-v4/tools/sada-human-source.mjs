import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SADA_FILTER,SADA_SOURCE,normalizeSadaRow,rankSadaSpeakerGroups } from './voice/sada-source-config.mjs';

const PAGE_LENGTH=100;
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const OUT=resolve(ROOT,'build/voice/sada');

function arg(name,fallback=null){const i=process.argv.indexOf(`--${name}`);return i>=0?process.argv[i+1]:fallback;}
function flag(name){return process.argv.includes(`--${name}`);}
function numArg(name,fallback){const n=Number(arg(name,fallback));return Number.isFinite(n)?n:fallback;}
function headers(){return process.env.HF_TOKEN?{Authorization:`Bearer ${process.env.HF_TOKEN}`}:{}}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function fetchJson(url,{attempts=4}={}){
  let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{
      const response=await fetch(url,{headers:headers()});
      if(response.ok)return response.json();
      const body=await response.text();
      const retryable=response.status===429||response.status>=500;
      lastError=new Error(`Hugging Face API ${response.status}: ${body}`);
      if(!retryable||attempt===attempts)throw lastError;
    }catch(error){
      lastError=error;
      if(attempt===attempts)throw error;
    }
    await sleep(700*attempt);
  }
  throw lastError||new Error('Hugging Face API request failed');
}

async function fetchCandidates(startOffset,maxRows){
  const rows=[];
  let total=null;
  const endOffset=startOffset+maxRows;
  for(let offset=startOffset;offset<endOffset;offset+=PAGE_LENGTH){
    const url=new URL('/rows',SADA_SOURCE.viewerApi);
    url.search=new URLSearchParams({dataset:SADA_SOURCE.dataset,config:SADA_SOURCE.config,split:SADA_SOURCE.split,offset:String(offset),length:String(Math.min(PAGE_LENGTH,endOffset-offset))});
    const payload=await fetchJson(url);
    if(Number.isFinite(Number(payload.num_rows_total)))total=Number(payload.num_rows_total);
    const page=(payload.rows||[]).map(normalizeSadaRow);
    rows.push(...page);
    console.log(`Metadata offset ${startOffset}: ${rows.length}${total?` / ${Math.min(maxRows,Math.max(0,total-startOffset))}`:''}`);
    if(page.length<PAGE_LENGTH||(total!==null&&offset+page.length>=total))break;
  }
  return {rows,total};
}

function safeName(value){return String(value||'clip').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,140);}

async function saveJson(name,value){await mkdir(OUT,{recursive:true});await writeFile(resolve(OUT,name),`${JSON.stringify(value,null,2)}\n`,'utf8');}

async function downloadGroup(group,{targetMinutes,maxMb}){
  const dir=resolve(OUT,'raw',safeName(group.key));await mkdir(dir,{recursive:true});
  let seconds=0,bytes=0,count=0;const files=[];
  for(const row of group.rows){
    if(seconds>=targetMinutes*60||bytes>=maxMb*1024*1024)break;
    const response=await fetch(row.audioSrc,{headers:headers()});if(!response.ok)continue;
    const body=Buffer.from(await response.arrayBuffer());
    if(bytes+body.length>maxMb*1024*1024)break;
    const file=`${String(count+1).padStart(3,'0')}-${safeName(row.segmentId)}.wav`;
    await writeFile(resolve(dir,file),body);
    files.push({file,segmentId:row.segmentId,text:row.text,durationSeconds:row.durationSeconds});
    seconds+=row.durationSeconds;bytes+=body.length;count+=1;
  }
  const attribution=`# SADA human voice source\n\nSource: ${SADA_SOURCE.sourceUrl}\n\nLicense: ${SADA_SOURCE.license}\n\nSelected group: ${group.key}\n\nThis raw material is used only as a human-recorded source for the personal, non-commercial learning app. Do not commit this raw corpus directory.\n`;
  await writeFile(resolve(OUT,'ATTRIBUTION.md'),attribution,'utf8');
  await saveJson('selected-speaker.json',{source:SADA_SOURCE,group:{key:group.key,recordingId:group.recordingId,speaker:group.speaker,showName:group.showName},downloaded:{count,seconds,megabytes:Number((bytes/1024/1024).toFixed(2)),files}});
  return {count,seconds,bytes};
}

async function main(){
  const startOffset=Math.max(0,Math.min(7000,numArg('start-offset',0)));
  const maxRows=Math.max(100,Math.min(7000,numArg('max-rows',7000)));
  const targetMinutes=Math.max(1,Math.min(30,numArg('target-minutes',8)));
  const maxMb=Math.max(25,Math.min(500,numArg('max-mb',180)));
  console.log(`Scanning SADA row metadata only — offset ${startOffset}, max ${maxRows}; no corpus audio download.`);
  const fetched=await fetchCandidates(startOffset,maxRows),groups=rankSadaSpeakerGroups(fetched.rows);
  const summary=groups.slice(0,10).map(({rows:clips,...group})=>({...group,minutes:Number((group.totalSeconds/60).toFixed(2))}));
  const scanName=startOffset?`scan-${startOffset}.json`:'scan-0.json';
  const scan={source:SADA_SOURCE,filter:SADA_FILTER,startOffset,scannedRows:fetched.rows.length,totalRows:fetched.total,eligibleRows:groups.reduce((n,g)=>n+g.rows.length,0),topGroups:summary};
  await saveJson(scanName,scan);
  if(startOffset===0)await saveJson('scan.json',scan);
  console.table(summary.map(g=>({group:g.key,clips:g.clipCount,minutes:g.minutes,show:g.showName})));
  if(!groups.length){
    console.log('No clean adult male Najdi speaker group in this metadata slice.');
    if(flag('require-candidate'))process.exitCode=2;
    return;
  }
  if(!flag('download')){console.log(`Best candidate: ${groups[0].key}`);return;}
  const requested=arg('group');const group=requested?groups.find(item=>item.key===requested):groups[0];
  if(!group)throw new Error(`Requested group not found: ${requested}`);
  const result=await downloadGroup(group,{targetMinutes,maxMb});
  console.log(`Downloaded ${result.count} clips, ${(result.seconds/60).toFixed(1)} min, ${(result.bytes/1024/1024).toFixed(1)} MB.`);
}

await main();
