function setFallbackStimulus(host,challenge,fallbackVisualMarkup){
  if(!host)return;
  host.replaceChildren();
  const markup=typeof fallbackVisualMarkup==='function'?fallbackVisualMarkup(challenge):'';
  if(markup)host.innerHTML=markup;
}

function appendOptionContent(button,registry,challenge,value){
  const custom=registry?.renderOption?.(challenge,value,{compact:true});
  if(!custom){
    button.textContent=registry?.labelForOption?.(challenge,value)??String(value);
    return false;
  }
  button.classList.add('xo-challenge-option-visual');
  const visual=document.createElement('span');
  visual.className='xo-challenge-option-art';
  visual.appendChild(custom);
  const label=document.createElement('span');
  label.className='xo-challenge-option-label';
  label.textContent=registry?.labelForOption?.(challenge,value)??String(value);
  button.append(visual,label);
  return true;
}

export function renderXoChallengePresentation({
  registry=null,
  challenge,
  visualHost=null,
  optionsHost=null,
  disabled=false,
  fallbackVisualMarkup=null,
  onAnswer=null
}={}){
  if(visualHost){
    visualHost.replaceChildren();
    const custom=registry?.renderStimulus?.(challenge,{compact:true});
    if(custom)visualHost.appendChild(custom);
    else setFallbackStimulus(visualHost,challenge,fallbackVisualMarkup);
  }

  if(!optionsHost)return;
  optionsHost.replaceChildren();
  for(const value of challenge?.options||[]){
    const button=document.createElement('button');
    button.type='button';
    button.className='xo-challenge-option';
    button.dataset.challengeAnswer=String(value);
    button.disabled=Boolean(disabled);
    appendOptionContent(button,registry,challenge,value);
    button.addEventListener('click',()=>onAnswer?.(button.dataset.challengeAnswer,button));
    optionsHost.appendChild(button);
  }
}
