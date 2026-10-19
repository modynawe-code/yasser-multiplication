import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {WORD_ORDER_AUDIO_CLIPS} from '../src/modules/khaled/literacy/word-order-audio-manifest.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'assets/khaled/literacy/word-reading-practice.mp4');
const output=path.join(root,'assets/audio/khaled/literacy/word-order');
await mkdir(output,{recursive:true});
for(const clip of WORD_ORDER_AUDIO_CLIPS){
  const target=path.join(output,`${clip.id}.mp3`);
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(clip.start),'-i',source,'-t',String(clip.end-clip.start),'-vn','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','48k',target],{stdio:'inherit'});
  if(result.status!==0)throw new Error(`ffmpeg failed for ${clip.word}`);
}
console.log(`Extracted ${WORD_ORDER_AUDIO_CLIPS.length} voice-only word clips.`);
