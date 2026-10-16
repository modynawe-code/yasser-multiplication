// Contact and coin sounds are locally synthesized, with no network or autoplay requirement.
export function createVaultAudio(){let context=null,muted=false;
 function unlock(){try{context ||=new (globalThis.AudioContext||globalThis.webkitAudioContext)();context.resume().catch(()=>{});}catch{} }
 function tone(f,t,d=.12,g=.08){if(!context||muted)return;const o=context.createOscillator(),a=context.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(context.destination);o.start(t);o.stop(t+d);}
 function contact(t,g=.18){if(!context||muted)return;const n=Math.ceil(context.sampleRate*.075),b=context.createBuffer(1,n,context.sampleRate),data=b.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/n*7);const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=b;filter.type='lowpass';filter.frequency.value=1500;gain.gain.value=g;source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start(t);tone(180,t,.07,g/3);}
 function play(type,count=1){if(!context||muted||context.state!=='running')return;const t=context.currentTime;
 if(type==='roll'){[0,.12,.27,.46,.59,.78,.94].forEach((offset,i)=>contact(t+offset,.22-i*.02));}
 else if(type==='edge')contact(t,.055);
 else if(type==='preview')tone(550,t,.045,.012);
 else if(type==='coin'){for(let i=0;i<count;i++){tone(1320,t+i*.14,.18,.075);tone(1980,t+i*.14+.035,.22,.035);}}
 else if(type==='turn'){tone(440,t,.13,.035);tone(660,t+.08,.15,.04);}
 else if(type==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,t+i*.13,.35,.07));}
 }
 return {unlock,play,setMuted(value){muted=Boolean(value);if(muted)context?.suspend().catch(()=>{});else unlock();},get muted(){return muted;}};
}
