import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/modules/khaled/literacy/khaled-literacy.js',import.meta.url),'utf8');
const {bindKhaledLiteracyControls,KHALED_LITERACY_VIDEOS}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

class Control extends EventTarget{
  value='1';textContent='';hidden=true;disabled=false;attributes={};
  setAttribute(key,value){this.attributes[key]=value;}
  emit(event){this.dispatchEvent(new Event(event));}
}
class Media extends Control{
  duration=126.9;currentTime=0;paused=true;ended=false;playbackRate=1;
  async play(){this.paused=false;this.emit('play');}
  pause(){this.paused=true;this.emit('pause');}
}
function setup(){
  const player=new Media();
  const controls=Object.fromEntries(['Toggle','Seek','Time','Speed','Rewind','Forward','Status'].map(id=>[id,new Control()]));
  const view={querySelector(selector){return selector==='#khaledLiteracyVideo'?player:controls[selector.replace('#khaledLiteracy','')];}};
  bindKhaledLiteracyControls(view);
  return {player,...controls};
}
test('seven lessons include Noon and word reading videos',()=>{
  assert.equal(KHALED_LITERACY_VIDEOS.length,7);
  assert.equal(new Set(KHALED_LITERACY_VIDEOS.map(v=>v.id)).size,7);
  assert.equal(KHALED_LITERACY_VIDEOS[4].path,'assets/khaled/literacy/noon-reading.mp4');
  assert.equal(KHALED_LITERACY_VIDEOS[5].path,'assets/khaled/literacy/noon-summary.mp4');
  assert.equal(KHALED_LITERACY_VIDEOS[6].path,'assets/khaled/literacy/word-reading-practice.mp4');
});
test('time display, seek and ten-second jumps stay within the video',()=>{
  const {player,Time,Seek,Forward,Rewind}=setup();
  assert.equal(Time.textContent,'0:00 / 2:06');
  Seek.value='45.5';Seek.emit('input');assert.equal(player.currentTime,45.5);
  assert.equal(Time.textContent,'0:45 / 2:06');
  Forward.emit('click');assert.equal(player.currentTime,55.5);
  player.currentTime=123;Forward.emit('click');assert.equal(player.currentTime,126.9);
  player.currentTime=4;Rewind.emit('click');assert.equal(player.currentTime,0);
  player.duration=NaN;player.currentTime=0;player.emit('emptied');
  assert.equal(Seek.disabled,true);assert.equal(Time.textContent,'0:00 / 0:00');
});
test('play/pause labels track both custom and native playback',async()=>{
  const {player,Toggle}=setup();
  Toggle.emit('click');await Promise.resolve();
  assert.equal(player.paused,false);assert.match(Toggle.textContent,/إيقاف مؤقت/);
  Toggle.emit('click');assert.equal(player.paused,true);assert.match(Toggle.textContent,/تشغيل/);
  player.paused=false;player.emit('play');assert.match(Toggle.textContent,/إيقاف مؤقت/);
  player.ended=true;player.emit('ended');assert.match(Toggle.textContent,/تشغيل/);
});
test('all seven speeds work and chosen rate survives a lesson load',()=>{
  const {player,Speed}=setup();
  for(const rate of [0.5,0.75,1,1.25,1.5,1.75,2]){Speed.value=String(rate);Speed.emit('change');assert.equal(player.playbackRate,rate);}
  player.playbackRate=1;player.emit('loadedmetadata');assert.equal(player.playbackRate,2);
  assert.equal(player.preservesPitch,true);
  Speed.value='9';Speed.emit('change');assert.equal(player.playbackRate,2);
});
test('failed playback gives a message; switching video clears it',async()=>{
  const {player,Toggle,Status}=setup();
  player.play=async()=>{throw new Error('Unavailable');};
  Toggle.emit('click');await Promise.resolve();await Promise.resolve();
  assert.equal(Status.hidden,false);assert.match(Status.textContent,/تعذر التشغيل/);
  player.emit('emptied');assert.equal(Status.hidden,true);
});

