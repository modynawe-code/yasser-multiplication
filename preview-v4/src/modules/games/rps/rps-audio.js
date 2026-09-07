import { createVoiceService } from '../../../shared/audio/voice-service.js';

export const RPS_AUDIO_CLIPS=Object.freeze({
  turnYasser:'assets/audio/rps/turn-yasser.mp3',
  turnKhaled:'assets/audio/rps/turn-khaled.mp3',
  draw:'assets/audio/rps/draw.mp3',
  pointYasser:'assets/audio/rps/point-yasser.mp3',
  pointKhaled:'assets/audio/rps/point-khaled.mp3',
  winYasser:'assets/audio/rps/win-yasser.mp3',
  winKhaled:'assets/audio/rps/win-khaled.mp3'
});

const SFX=Object.freeze({
  choose:[{frequency:360,duration:.045,gain:.014},{frequency:470,duration:.055,gain:.017,delay:.035}],
  reveal:[{frequency:260,duration:.05,gain:.015},{frequency:520,duration:.07,gain:.022,delay:.045},{frequency:760,duration:.08,gain:.024,delay:.095}],
  point:[{frequency:580,duration:.055,gain:.020},{frequency:760,duration:.075,gain:.024,delay:.045}]
});

function defaultContextFactory(){
  const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
  return AudioContextClass?new AudioContextClass():null;
}

export function createRpsAudio({voiceService=createVoiceService(),contextFactory=defaultContextFactory}={}){
  let context=null;

  function getContext(){
    if(context)return context;
    try{context=contextFactory();}catch{return null;}
    return context;
  }

  function playSfx(name){
    const pattern=SFX[name],audio=getContext();
    if(!pattern||!audio)return false;
    if(audio.state==='suspended')audio.resume?.().catch?.(()=>null);
    const start=audio.currentTime+.008;
    for(const note of pattern){
      const oscillator=audio.createOscillator(),gain=audio.createGain();
      const noteStart=start+(note.delay||0),noteEnd=noteStart+note.duration;
      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(note.frequency,noteStart);
      gain.gain.setValueAtTime(.0001,noteStart);
      gain.gain.exponentialRampToValueAtTime(note.gain,noteStart+.01);
      gain.gain.exponentialRampToValueAtTime(.0001,noteEnd);
      oscillator.connect(gain);gain.connect(audio.destination);
      oscillator.start(noteStart);oscillator.stop(noteEnd+.01);
    }
    return true;
  }

  function say(id,text){return voiceService.say({id,text,lang:'ar-SA',rate:.9,pitch:1,volume:1});}

  return Object.freeze({
    choose:()=>playSfx('choose'),
    reveal:()=>playSfx('reveal'),
    pointSfx:()=>playSfx('point'),
    turn:playerId=>playerId==='yasser'
      ?say('games.rps.turn.yasser','دور ياسر. حجر، ورق، مقص. اختر حركتك.')
      :say('games.rps.turn.khaled','دور خالد. حجر، ورق، مقص. اختر حركتك.'),
    point:playerId=>playerId==='yasser'
      ?say('games.rps.point.yasser','ياسر أخذ نقطة.')
      :say('games.rps.point.khaled','خالد أخذ نقطة.'),
    draw:()=>say('games.rps.draw','تعادل. نفس الحركة.'),
    win:playerId=>playerId==='yasser'
      ?say('games.rps.win.yasser','ياسر بطل المباراة. مبروك.')
      :say('games.rps.win.khaled','خالد بطل المباراة. مبروك.'),
    stop:()=>voiceService.stop()
  });
}

export { SFX as RPS_SOUND_PATTERNS };
