import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {ENGLISH_AUDIO_CLIPS,ENGLISH_AUDIO_VOICE,englishAudioPath} from '../src/modules/yasser/reviews/english-audio-manifest.js';
import {createEnglishReviewAudio,englishQuestionParts} from '../src/modules/yasser/reviews/english-review-audio.js';
import {REVIEW} from '../src/modules/yasser/reviews/english-grade6-data.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({fail=false,offline=false}={}){
 globalThis.document={baseURI:'https://example.com/app/'};
 const audio={pause(){},removeAttribute(){},load(){},play(){return fail?Promise.reject(new Error('blocked')):Promise.resolve();}};
 const saved=new Map();let requests=0;
 const cache={match:async url=>saved.get(url)?.clone(),put:async(url,response)=>saved.set(url,response)};
 const player=createEnglishReviewAudio({createAudio:()=>audio,cacheStorage:{open:async()=>cache},fetchFile:async()=>{requests++;if(offline)throw new Error('offline');return new Response(new Uint8Array([1,2,3]));}});
 return {audio,player,saved,requests:()=>requests,setOffline:()=>{offline=true;}};
}
test('Ryan inventory covers literal question and choices without answer fields',()=>{
 assert.equal(ENGLISH_AUDIO_VOICE,'en-GB-RyanNeural');assert.equal(ENGLISH_AUDIO_CLIPS.length,61);
 assert.deepEqual(new Set(ENGLISH_AUDIO_CLIPS.map(c=>c.text)),new Set(REVIEW.questions.flatMap(q=>[q.prompt,...q.choices||[]])));
 for(const q of REVIEW.questions){assert.deepEqual(englishQuestionParts(q).map(p=>p.text),[q.prompt,...q.choices||[]]);assert.ok(englishAudioPath(q.prompt));}
});
test('completion requires every segment to end in question/choice order',async()=>{
 const {audio,player}=setup();const parts=englishQuestionParts(REVIEW.questions[0]);const heard=[];let complete=false;
 const run=player.play(parts,{onPart:p=>heard.push(p.index),onComplete:()=>complete=true});
 for(let i=0;i<parts.length;i++){await tick();assert.equal(complete,false);assert.deepEqual(heard,Array.from({length:i+1},(_,k)=>k-1));audio.onended();}
 assert.equal(await run,true);assert.equal(complete,true);
});
test('stopping or replacing playback cannot complete an interrupted first reading',async()=>{
 const {audio,player}=setup();let oldCompleted=false,newCompleted=false;
 const old=player.play(englishQuestionParts(REVIEW.questions[0]),{onComplete:()=>oldCompleted=true});await tick();
 const next=player.play(englishQuestionParts(REVIEW.questions[10]),{onComplete:()=>newCompleted=true});await tick();
 audio.onended();assert.equal(await next,true);assert.equal(await old,false);assert.equal(oldCompleted,false);assert.equal(newCompleted,true);
});
test('playback rejection and missing clip fail closed',async()=>{
 const {player}=setup({fail:true});let complete=false,errors=0;
 assert.equal(await player.play(englishQuestionParts(REVIEW.questions[0]),{onComplete:()=>complete=true,onError:()=>errors++}),false);
 assert.equal(await player.play([{text:'not in manifest'}],{onComplete:()=>complete=true,onError:()=>errors++}),false);
 assert.equal(complete,false);assert.equal(errors,2);
});
test('download persists all 61 clips and playback reuses cache offline',async()=>{
 const {player,saved,requests,audio,setOffline}=setup();await player.download();setOffline();assert.equal(saved.size,61);assert.equal(requests(),61);
 const run=player.play(englishQuestionParts(REVIEW.questions[10]));await tick();audio.onended();await run;assert.equal(requests(),61);
});

test('every manifest MP3 is bundled with nonempty MPEG audio',()=>{for(const clip of ENGLISH_AUDIO_CLIPS){const bytes=readFileSync(new URL('../'+clip.path,import.meta.url));assert.ok(bytes.length>1000,clip.path);assert.ok(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224),clip.path);}});
