import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LETTERS,availableForms,connectionAt,examplesFor,loadProgress} from '../src/modules/khaled/letter-forms/letter-data.js';
import {writingPaths} from '../src/modules/khaled/letter-forms/writing-paths.js';
import {advanceCheckpoint} from '../src/modules/khaled/letter-forms/tracing.js';

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
 for(const path of ['letter-forms.js','letter-data.js','writing-paths.js','tracing.js','letter-forms.css'])assert.ok(sw.includes('/letter-forms/'+path),path);
 assert.ok(sw.includes('assets/khaled/letter-forms/connection-hands.png'));
});
