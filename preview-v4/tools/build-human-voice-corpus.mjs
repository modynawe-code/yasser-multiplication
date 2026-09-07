import { access,mkdir,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KHALED_SKILLS } from '../src/modules/khaled/domain/curriculum.js';
import { createKhaledRound } from '../src/modules/khaled/domain/question-bank.js';
import { createAdvancedKhaledRound } from '../src/modules/khaled/domain/advanced-question-bank.js';
import { humanVoiceAssetPath,normalizeVoiceText } from '../src/shared/audio/human-voice-assets.js';
import { HUMAN_VOICE_POLICY } from '../src/shared/audio/human-voice-policy.js';
import { VOICE_MANIFEST } from '../src/shared/audio/voice-manifest.js';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUT_DIR=resolve(ROOT,'build/voice');
const SAMPLE_SEEDS=1024;

const FIXED_LINES=Object.freeze([
  {id:'yasser.result.excellent',text:'ممتاز يا ياسر',source:'yasser'},
  {id:'yasser.result.good',text:'تقدم ممتاز يا ياسر',source:'yasser'},
  {id:'yasser.result.keep-going',text:'نكمل تدريب ونرفع المستوى',source:'yasser'},
  {id:'games.rps.turn.yasser',text:'دور ياسر. حجر، ورق، مقص. اختر حركتك.',source:'games:rps'},
  {id:'games.rps.turn.khaled',text:'دور خالد. حجر، ورق، مقص. اختر حركتك.',source:'games:rps'},
  {id:'games.rps.draw',text:'تعادل. نفس الحركة.',source:'games:rps'},
  {id:'games.rps.point.yasser',text:'ياسر أخذ نقطة.',source:'games:rps'},
  {id:'games.rps.point.khaled',text:'خالد أخذ نقطة.',source:'games:rps'},
  {id:'games.rps.win.yasser',text:'ياسر بطل المباراة. مبروك.',source:'games:rps'},
  {id:'games.rps.win.khaled',text:'خالد بطل المباراة. مبروك.',source:'games:rps'},
  {text:'ياسر فاز بالجولة. أحسنتم.',source:'games:xo'},
  {text:'خالد فاز بالجولة. أحسنتم.',source:'games:xo'},
  {text:'تعادل جميل. أحسنتم.',source:'games:xo'}
]);

function mulberry32(seed){
  let value=seed>>>0;
  return()=>{
    value+=0x6d2b79f5;
    let next=value;
    next=Math.imul(next^(next>>>15),next|1);
    next^=next+Math.imul(next^(next>>>7),next|61);
    return((next^(next>>>14))>>>0)/4294967296;
  };
}

function createCollector(){
  const byText=new Map();
  return{
    add({id=null,text,source='unknown'}={}){
      const normalized=normalizeVoiceText(text);
      if(!normalized)return;
      const existing=byText.get(normalized)||{id:null,text:normalized,sources:new Set()};
      if(id&&!existing.id)existing.id=id;
      existing.sources.add(source);
      byText.set(normalized,existing);
    },
    values(){
      return [...byText.values()].map(item=>{
        const explicit=item.id&&VOICE_MANIFEST[item.id];
        return{
          id:item.id,
          text:item.text,
          asset:explicit||humanVoiceAssetPath(item.text),
          sources:[...item.sources].sort()
        };
      }).sort((a,b)=>a.asset.localeCompare(b.asset,'en'));
    }
  };
}

function addYasserCorpus(collector){
  for(let table=1;table<=10;table++){
    for(let multiplier=1;multiplier<=10;multiplier++){
      collector.add({
        id:`yasser.multiply.${table}x${multiplier}`,
        text:`كم ناتج ${table} ضرب ${multiplier}؟`,
        source:'yasser:multiplication'
      });
    }
  }
}

function addKhaledCorpus(collector){
  KHALED_SKILLS.filter(skill=>skill.status==='ready').forEach((skill,skillIndex)=>{
    for(let seed=1;seed<=SAMPLE_SEEDS;seed++){
      const random=mulberry32((skillIndex+1)*1000003+seed);
      const questions=createAdvancedKhaledRound({skillId:skill.id,count:8,random})||createKhaledRound({skillId:skill.id,count:8,random});
      questions.forEach(question=>collector.add({text:question?.spokenPrompt,source:`khaled:${skill.id}`}));
    }
  });
}

export function buildHumanVoiceCorpus(){
  const collector=createCollector();
  FIXED_LINES.forEach(line=>collector.add(line));
  addYasserCorpus(collector);
  addKhaledCorpus(collector);
  return collector.values();
}

async function exists(path){try{await access(path);return true;}catch{return false;}}

async function writeInventory(corpus){
  await mkdir(OUT_DIR,{recursive:true});
  const payload={
    schemaVersion:1,
    locale:HUMAN_VOICE_POLICY.locale,
    runtimeMode:HUMAN_VOICE_POLICY.runtimeMode,
    releaseMode:HUMAN_VOICE_POLICY.releaseMode,
    generatedAt:new Date().toISOString(),
    sampleSeeds:SAMPLE_SEEDS,
    count:corpus.length,
    items:corpus
  };
  await writeFile(resolve(OUT_DIR,'human-voice-recording-script.json'),`${JSON.stringify(payload,null,2)}\n`,'utf8');
  const header='asset\tid\ttext\tsources';
  const rows=corpus.map(item=>[item.asset,item.id||'',item.text,item.sources.join(',')].map(value=>String(value).replace(/\t|\r?\n/g,' ')).join('\t'));
  await writeFile(resolve(OUT_DIR,'human-voice-recording-script.tsv'),`${[header,...rows].join('\n')}\n`,'utf8');
}

async function checkCoverage(corpus,{strict=false}={}){
  const checks=await Promise.all(corpus.map(async item=>({...item,present:await exists(resolve(ROOT,item.asset))})));
  const missing=checks.filter(item=>!item.present);
  await mkdir(OUT_DIR,{recursive:true});
  await writeFile(resolve(OUT_DIR,'human-voice-missing.json'),`${JSON.stringify({count:missing.length,items:missing},null,2)}\n`,'utf8');
  console.log(`Human voice corpus: ${corpus.length}`);
  console.log(`Recorded clips: ${corpus.length-missing.length}`);
  console.log(`Missing clips: ${missing.length}`);
  console.log(`Runtime voice mode: ${HUMAN_VOICE_POLICY.runtimeMode}`);
  if(strict&&HUMAN_VOICE_POLICY.runtimeMode!=='human-only'){
    console.error('Human-only release gate failed: runtimeMode must be human-only before release.');
    process.exitCode=1;
  }
  if(strict&&missing.length){
    console.error('Human-only release gate failed: recorded voice coverage is incomplete.');
    process.exitCode=1;
  }
}

const args=new Set(process.argv.slice(2));
const corpus=buildHumanVoiceCorpus();
await writeInventory(corpus);
if(args.has('--check')||args.has('--strict'))await checkCoverage(corpus,{strict:args.has('--strict')});
