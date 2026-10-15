import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LETTERS,availableForms,connectionAt,examplesFor,loadProgress} from '../src/modules/khaled/letter-forms/letter-data.js';
import {writingPaths} from '../src/modules/khaled/letter-forms/writing-paths.js';
import {advanceCheckpoint} from '../src/modules/khaled/letter-forms/tracing.js';
import {createLetterLessonAudio,LETTER_FORM_NARRATION} from '../src/modules/khaled/letter-forms/lesson-audio.js';
import {humanVoiceAssetPath} from '../src/shared/audio/human-voice-assets.js';

test('Arabic neighbours determine forms, including disconnected middle and final letters',()=>{
 const cases=[['صباح',0,'initial'],['عصفور',1,'medial'],['قفص',2,'final'],['قرص',2,'isolated'],['أصفر',1,'initial'],['باب',2,'isolated'],['بذرة',1,'final'],['مدرسة',2,'isolated'],['دلو',2,'final'],['ا ب',2,'isolated'],['بَاب',2,'isolated']];
 for(const [word,index,expected]of cases)assert.equal(connectionAt(word,index).form,expected,word+':'+index);
});
test('All 28 letters have real paths for all applicable forms and valid examples',()=>{
 assert.equal(LETTERS.length,28);assert.equal(new Set(LETTERS.map(l=>l.char)).size,28);
 for(const l of LETTERS){
  assert.equal(availableForms(l).length,'ادذرزو'.includes(l.char)?2:4);
  for(const f of availableForms(l)){
   const paths=writingPaths(l.char,f);assert.ok(paths.length,l.char+f);assert.ok(paths.every(p=>/^M/.test(p)));
   assert.ok(examplesFor(l).some(e=>e.form===f),l.char+' example for '+f);
  }
  for(const e of examplesFor(l)){assert.equal(Array.from(e.word)[e.index],l.char);assert.ok(availableForms(l).includes(e.form));}
 }
});
test('Tracing cannot skip to the end or pass by scribbling on a single point',()=>{
 const samples=Array.from({length:50},(_,i)=>({x:i*5,y:100}));
 assert.equal(advanceCheckpoint(samples,0,{x:245,y:100}),0);
 const cursor=advanceCheckpoint(samples,0,{x:0,y:100});assert.ok(cursor>0&&cursor<10);
 assert.equal(advanceCheckpoint(samples,cursor,{x:0,y:100}),cursor);
 let progress=0;for(const p of samples)progress=advanceCheckpoint(samples,progress,p);
 assert.equal(progress,samples.length);
});
test('Progress recovers from missing, corrupt, old and invalid stored values',()=>{
 for(const text of [null,'bad','{}','{"version":0}','{"version":1,"last":"<script>","letters":[]}']){
  const p=loadProgress({getItem:()=>text});assert.equal(p.version,1);assert.equal(p.last,'ا');assert.deepEqual(p.letters,{});
 }
 assert.equal(loadProgress({getItem(){throw Error('denied')}}).last,'ا');
});
test('Activity is linked from Khaled literacy and its dependencies are available offline',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [literacy,sw]=await Promise.all([read('src/modules/khaled/literacy/khaled-literacy.js'),read('service-worker.js')]);
 assert.match(literacy,/id="khaledLetterFormsOpen"/);
 for(const path of ['letter-forms.js','lesson-audio.js','letter-data.js','writing-paths.js','tracing.js','letter-forms.css'])assert.ok(sw.includes('/letter-forms/'+path),path);
 assert.ok(sw.includes('assets/khaled/letter-forms/connection-hands.png'));
});

test('Letter playback uses the existing recorded Arabic-letter assets and feedback stops it',async()=>{
 const created=[],played=[],stopped=[],events=[];
 class FakeAudio{
  constructor(src){this.src=src;this.handlers={};created.push(this);}
  addEventListener(name,handler){this.handlers[name]=handler;}
  async play(){played.push(this.src);}
  pause(){stopped.push(this.src);}
 }
 const effects={correct:()=>events.push('correct'),wrong:()=>events.push('wrong'),achievement:()=>events.push('achievement')};
 const audio=createLetterLessonAudio({AudioClass:FakeAudio,effects});
 const pending=audio.playLetter('sad');
 await Promise.resolve();
 assert.equal(played[0],'./assets/audio/mashaal/arabic-letters/sad.mp3');
 assert.equal(audio.playFeedback('correct'),1);
 assert.equal(await pending,false);
 assert.deepEqual(stopped,[played[0]]);
 assert.deepEqual(events,['correct']);
 assert.equal(await audio.playLetter('../sad'),false);
});

test('Human explanations and response lines resolve to the shared recording inventory without TTS',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [audio,recordingContract,inventory,controller]=await Promise.all([read('src/modules/khaled/letter-forms/lesson-audio.js'),read('assets/audio/khaled/letter-forms/README.md'),read('tools/build-human-voice-corpus.mjs'),read('src/modules/khaled/letter-forms/letter-forms.js')]);
 assert.match(audio,/assets\/audio\/mashaal\/arabic-letters/);
 assert.match(audio,/humanVoiceAssetPath/);
 assert.equal(Object.keys(LETTER_FORM_NARRATION).length,7);
 assert.equal(LETTER_FORM_NARRATION.correct.id,'khaled.letter-forms.feedback.correct');
 assert.match(humanVoiceAssetPath(LETTER_FORM_NARRATION.correct.text),/^assets\/audio\/human\/[a-f0-9]{16}\.mp3$/);
 assert.match(recordingContract,/بصوت بشري حقيقي/);
 assert.match(recordingContract,/fcc8769af39488ad\.mp3/);
 assert.match(recordingContract,/لا يستخدم التطبيق صوتًا آليًا/);
 assert.doesNotMatch(audio,/speechSynthesis|SpeechSynthesisUtterance/);
 for(const [id,line] of Object.entries(LETTER_FORM_NARRATION)){
  assert.ok(inventory.includes(line.text),id+' appears in human recording inventory');
  assert.ok(recordingContract.includes(humanVoiceAssetPath(line.text).split('/').at(-1)),id+' has the correct recording filename');
  if(['forms','connections','question','writing'].includes(id))assert.ok(controller.includes(`data-line="${id}"`),id+' has a play control');
 }
 assert.match(controller,/audio\.respond\('correct','correct'\)/);
 assert.match(controller,/audio\.respond\('wrong','retry'\)/);
});

test('Correct response cue plays and requests the fixed human line with no TTS fallback',async()=>{
 const sequence=[];
 class FakeAudio{
  constructor(src){this.src=src;}
  addEventListener(name,handler){if(name==='ended')this.ended=handler;}
  play(){sequence.push('voice');this.ended?.();}
  pause(){}
 }
 const audio=createLetterLessonAudio({AudioClass:FakeAudio,effects:{correct:()=>sequence.push('correct'),wrong:()=>sequence.push('wrong'),achievement:()=>sequence.push('achievement')}});
 assert.equal(await audio.respond('correct','correct'),true);
 assert.deepEqual(sequence,['correct','voice']);
});
