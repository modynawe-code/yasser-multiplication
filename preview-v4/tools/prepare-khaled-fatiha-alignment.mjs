/**
 * DEVELOPMENT-ONLY importer for Munajjam verse alignment output.
 * Never writes to the runtime bundle or makes an automatic approval decision.
 *
 * Usage (requires ffprobe and verified bundled Al-Akhdar Fatiha MP3):
 *   node tools/prepare-khaled-fatiha-alignment.mjs /path/to/munajjam-001.json > candidate.json
 * Every timestamp must be checked by a human against this exact MP3 before release.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MASHAAL_RECITATION_MEDIA} from '../src/modules/mashaal/curriculum/recitation-media-manifest.js';

const officialFatiha=MASHAAL_RECITATION_MEDIA.find(asset=>
  asset.surahNumber===1&&asset.sourceId==='kfgqpc-ibrahim-al-akhdar-hafs'
);
if(!officialFatiha)throw new Error('approved-local-fatiha-source-not-found');

export function buildFatihaAlignmentCandidate(alignment,{actualSha256,expectedSha256,durationMs}={}){
  if(typeof actualSha256!=='string'||!expectedSha256||actualSha256!==expectedSha256){
    throw new Error('local-fatiha-audio-sha256-mismatch');
  }
  if(!Number.isFinite(durationMs)||durationMs<=0)throw new Error('audio-duration-required');
  const rows=Array.isArray(alignment)?alignment:alignment?.results;
  if(!Array.isArray(rows)||rows.length!==7)throw new Error('seven-fatiha-ayahs-required');
  let previousEnd=0;
  const ayahTimings=rows.map((row,index)=>{
    const number=Number(row.ayah_number??(Number(row.ayah_index)+1));
    const start=Number(row.start_time??row.start),end=Number(row.end_time??row.end);
    const confidence=Number(row.similarity_score);
    if(number!==index+1||!Number.isFinite(start)||!Number.isFinite(end)
      ||!Number.isFinite(confidence)||confidence<0.85||confidence>1){
      throw new Error('invalid-ayah-number-or-low-confidence:'+String(index+1));
    }
    const startMs=Math.round(start*1000),endMs=Math.round(end*1000);
    if(startMs<previousEnd||endMs<=startMs||endMs>durationMs+100){
      throw new Error('overlapping-or-out-of-range-ayah:'+String(index+1));
    }
    previousEnd=endMs;
    return {ayahKey:'1:'+String(index+1),startMs,endMs,confidence};
  });
  return {
    status:'REQUIRES_HUMAN_AUDIO_REVIEW',
    learnerScope:'candidate-only',
    sourceTool:'Itqan Munajjam',
    reciter:'إبراهيم الأخضر',
    riwayah:'حفص عن عاصم',
    surahNumber:1,
    approvedAudioSha256:expectedSha256,
    durationMs:Math.round(durationMs),
    ayahTimings,
    warning:'Auto-aligned timings are not verified or used in the live child player.'
  };
}

async function main(){
  const inputFile=process.argv[2];
  if(!inputFile)throw new Error('usage: node tools/prepare-khaled-fatiha-alignment.mjs <munajjam-json-file>');
  const audioPath=fileURLToPath(new URL('../'+officialFatiha.localPath.replace(/^\.\//,''),import.meta.url));
  const audio=await readFile(audioPath);
  const actualSha256=createHash('sha256').update(audio).digest('hex');
  const duration=Number(execFileSync('ffprobe',[
    '-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',audioPath
  ],{encoding:'utf8'}).trim());
  const alignment=JSON.parse(await readFile(inputFile,'utf8'));
  const candidate=buildFatihaAlignmentCandidate(alignment,{
    actualSha256,expectedSha256:officialFatiha.sha256,durationMs:duration*1000
  });
  console.log(JSON.stringify(candidate,null,2));
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
  main().catch(error=>{console.error('Alignment not approved:',error.message);process.exitCode=1;});
}
