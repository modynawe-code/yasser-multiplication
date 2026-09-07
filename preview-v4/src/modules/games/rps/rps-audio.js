const PATTERNS=Object.freeze({
  choose:[
    {frequency:360,duration:.045,gain:.014},
    {frequency:470,duration:.055,gain:.017,delay:.035}
  ],
  reveal:[
    {frequency:260,duration:.05,gain:.015},
    {frequency:520,duration:.07,gain:.022,delay:.045},
    {frequency:760,duration:.08,gain:.024,delay:.095}
  ],
  point:[
    {frequency:580,duration:.055,gain:.020},
    {frequency:760,duration:.075,gain:.024,delay:.045}
  ]
});

function defaultContextFactory(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  return AudioContextClass?new AudioContextClass():null;
}

export function createRpsAudio({contextFactory=defaultContextFactory}={}){
  let context=null;

  function getContext(){
    if(context)return context;
    try{context=contextFactory();}
    catch{return null;}
    return context;
  }

  function play(name){
    const pattern=PATTERNS[name],audio=getContext();
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

  return Object.freeze({
    choose:()=>play('choose'),
    reveal:()=>play('reveal'),
    point:()=>play('point')
  });
}

export { PATTERNS as RPS_SOUND_PATTERNS };
