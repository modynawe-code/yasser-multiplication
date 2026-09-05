export const SOUND_PATTERNS={
  correct:[
    {frequency:620,duration:.07,gain:.026},
    {frequency:820,duration:.09,gain:.030,delay:.055}
  ],
  wrong:[
    {frequency:235,duration:.08,gain:.018},
    {frequency:185,duration:.10,gain:.016,delay:.06}
  ],
  achievement:[
    {frequency:520,duration:.07,gain:.024},
    {frequency:660,duration:.08,gain:.027,delay:.055},
    {frequency:820,duration:.11,gain:.030,delay:.115}
  ]
};

function defaultContextFactory(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  return AudioContextClass?new AudioContextClass():null;
}

export function createFeedbackAudio({contextFactory=defaultContextFactory}={}){
  let context=null;

  function getContext(){
    if(context)return context;
    try{context=contextFactory();}
    catch{return null;}
    return context;
  }

  function play(patternName){
    const pattern=SOUND_PATTERNS[patternName];
    const audio=getContext();
    if(!pattern||!audio)return false;

    if(audio.state==='suspended')audio.resume?.().catch?.(()=>null);
    const start=audio.currentTime+.008;

    for(const note of pattern){
      const oscillator=audio.createOscillator();
      const gain=audio.createGain();
      const noteStart=start+(note.delay||0);
      const noteEnd=noteStart+note.duration;

      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(note.frequency,noteStart);
      gain.gain.setValueAtTime(.0001,noteStart);
      gain.gain.exponentialRampToValueAtTime(note.gain,noteStart+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,noteEnd);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd+.01);
    }

    return true;
  }

  return{
    correct:()=>play('correct'),
    wrong:()=>play('wrong'),
    achievement:()=>play('achievement')
  };
}
