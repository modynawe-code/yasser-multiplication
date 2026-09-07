export const RPS_AUDIO_CLIPS=Object.freeze({
  choose:'assets/audio/rps/sfx-choose.mp3',
  reveal:'assets/audio/rps/sfx-reveal.mp3',
  point:'assets/audio/rps/sfx-point.mp3',
  turnYasser:'assets/audio/rps/turn-yasser.mp3',
  turnKhaled:'assets/audio/rps/turn-khaled.mp3',
  draw:'assets/audio/rps/draw.mp3',
  pointYasser:'assets/audio/rps/point-yasser.mp3',
  pointKhaled:'assets/audio/rps/point-khaled.mp3',
  winYasser:'assets/audio/rps/win-yasser.mp3',
  winKhaled:'assets/audio/rps/win-khaled.mp3'
});

const VOICE_KEYS=new Set(['turnYasser','turnKhaled','draw','pointYasser','pointKhaled','winYasser','winKhaled']);

export function createRpsAudio({AudioClass=globalThis.Audio}={}){
  const unavailable=new Set();
  let currentVoice=null;

  function play(key,{volume=1,interruptVoice=false}={}){
    const src=RPS_AUDIO_CLIPS[key];
    if(!src||unavailable.has(src)||typeof AudioClass!=='function')return false;
    if(interruptVoice&&currentVoice){try{currentVoice.pause();currentVoice.currentTime=0;}catch{}currentVoice=null;}
    let audio;
    try{audio=new AudioClass(src);}catch{unavailable.add(src);return false;}
    audio.preload='auto';audio.volume=volume;
    if(VOICE_KEYS.has(key))currentVoice=audio;
    const cleanup=()=>{if(currentVoice===audio)currentVoice=null;};
    audio.addEventListener?.('ended',cleanup,{once:true});
    audio.addEventListener?.('error',()=>{unavailable.add(src);cleanup();},{once:true});
    try{
      const result=audio.play?.();
      result?.catch?.(()=>{unavailable.add(src);cleanup();});
      return true;
    }catch{unavailable.add(src);cleanup();return false;}
  }

  function stop(){
    if(!currentVoice)return;
    try{currentVoice.pause();currentVoice.currentTime=0;}catch{}
    currentVoice=null;
  }

  return Object.freeze({
    choose:()=>play('choose',{volume:.75}),
    reveal:()=>play('reveal',{volume:.85}),
    point:playerId=>play(playerId==='yasser'?'pointYasser':'pointKhaled',{interruptVoice:true}),
    draw:()=>play('draw',{interruptVoice:true}),
    turn:playerId=>play(playerId==='yasser'?'turnYasser':'turnKhaled',{interruptVoice:true}),
    win:playerId=>play(playerId==='yasser'?'winYasser':'winKhaled',{interruptVoice:true}),
    pointSfx:()=>play('point',{volume:.85}),
    stop,
    get unavailable(){return new Set(unavailable);}
  });
}
