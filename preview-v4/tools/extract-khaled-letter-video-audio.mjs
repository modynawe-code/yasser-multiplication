#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {mkdir,stat} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LETTER_VIDEO_AUDIO_CLIPS} from '../src/modules/khaled/letter-forms/letter-video-audio-manifest.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=process.argv[2];
if(!source){console.error('Usage: node tools/extract-khaled-letter-video-audio.mjs /path/to/user-provided-video.mp4');process.exit(2);}
const absoluteSource=resolve(source),outputDir=resolve(root,'assets/audio/khaled/letter-forms/video');
const imageDir=resolve(root,'assets/images/khaled/letter-forms/video');
await mkdir(outputDir,{recursive:true});
await mkdir(imageDir,{recursive:true});
for(const clip of LETTER_VIDEO_AUDIO_CLIPS){
 const output=resolve(outputDir,`${clip.id}.mp3`);
 const args=['-hide_banner','-loglevel','error','-ss',String(clip.start),'-i',absoluteSource,'-t',String(clip.end-clip.start),'-map','0:a:0','-vn','-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','96k','-y',output];
 const result=spawnSync('ffmpeg',args,{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`ffmpeg failed for ${clip.letter} (${clip.id}) with status ${result.status}`);
 const info=await stat(output);if(info.size<4096)throw new Error(`Extracted audio is unexpectedly small for ${clip.letter}: ${info.size} bytes`);
 const imageOutput=resolve(imageDir,`${clip.id}.jpg`);
 const imageArgs=['-hide_banner','-loglevel','error','-ss',String(clip.imageTime),'-i',absoluteSource,'-frames:v','1','-vf','scale=900:-1','-q:v','4','-y',imageOutput];
 const imageResult=spawnSync('ffmpeg',imageArgs,{stdio:'inherit'});
 if(imageResult.error)throw imageResult.error;
 if(imageResult.status!==0)throw new Error(`ffmpeg failed to extract the ${clip.letter} example image with status ${imageResult.status}`);
 const imageInfo=await stat(imageOutput);if(imageInfo.size<4096)throw new Error(`Extracted example image is unexpectedly small for ${clip.letter}: ${imageInfo.size} bytes`);
 console.log(`${clip.letter} (${clip.id}): ${(clip.end-clip.start).toFixed(2)} s voice, ${info.size} bytes; example image at ${clip.imageTime}s, ${imageInfo.size} bytes`);
}
