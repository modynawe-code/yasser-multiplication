const SVG_NS='http://www.w3.org/2000/svg';

function host(kind,{compact=false}={}){
  const el=document.createElement('span');
  el.className=`mashaal-guided-action-art${compact?' compact':''}`;
  el.dataset.semanticChoice=kind;
  el.setAttribute('aria-hidden','true');
  return el;
}

const frame=(body,background='#fbfbff',stroke='#dfe4f1')=>`<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
  <rect x="18" y="18" width="604" height="324" rx="34" fill="${background}" stroke="${stroke}" stroke-width="4"/>
  ${body}
</svg>`;

function faucet(){return `
  <path d="M292 80v56h73c30 0 48 18 48 48v14" fill="none" stroke="#6d8195" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="262" y="61" width="61" height="25" rx="12" fill="#8da0b0"/>
  <path d="M209 284h270c0 35-31 55-72 55H281c-41 0-72-20-72-55Z" fill="#d8edf8" stroke="#9ecce4" stroke-width="5"/>
  <path d="M342 284v-36" stroke="#8fb9d0" stroke-width="14" stroke-linecap="round"/>
`;}

function hands(){return `
  <path d="M220 230c31-31 68-35 107-15l43 22-24 38-47-16-35 15-55-18c-23-8-19-34 11-26Z" fill="#f3b482" stroke="#d89467" stroke-width="4"/>
  <path d="M420 229c-31-31-68-35-107-15l-43 22 24 38 47-16 35 15 55-18c23-8 19-34-11-26Z" fill="#f7c49c" stroke="#d89467" stroke-width="4"/>
`;}

function handwashingSvg(kind){
  let cue='';
  if(kind==='hands-under-water') cue=`
    <path d="M413 198v48" stroke="#56b7e9" stroke-width="12" stroke-linecap="round"/>
    <path d="M392 209v39M434 211v39" stroke="#8bd4f4" stroke-width="8" stroke-linecap="round"/>
    <path d="M390 265c8-13 16-13 24 0-8 13-16 13-24 0ZM423 271c7-11 14-11 21 0-7 11-14 11-21 0Z" fill="#5fc3ef"/>
  `;
  if(kind==='soap-on-hands') cue=`
    <rect x="90" y="137" width="82" height="111" rx="18" fill="#9ed9c3" stroke="#5eac91" stroke-width="5"/>
    <path d="M114 137v-31h56v16h28" fill="none" stroke="#587e74" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="284" cy="222" r="14" fill="#fff" stroke="#9ed9ef" stroke-width="4"/><circle cx="319" cy="211" r="11" fill="#fff" stroke="#9ed9ef" stroke-width="4"/><circle cx="350" cy="226" r="13" fill="#fff" stroke="#9ed9ef" stroke-width="4"/>
    <path d="M208 174c39-33 91-43 136-28" fill="none" stroke="#6fc7a8" stroke-width="8" stroke-linecap="round" stroke-dasharray="11 12"/>
  `;
  if(kind==='rubbing-hands') cue=`
    <circle cx="293" cy="218" r="13" fill="#fff" stroke="#9ed9ef" stroke-width="4"/><circle cx="325" cy="202" r="11" fill="#fff" stroke="#9ed9ef" stroke-width="4"/><circle cx="354" cy="219" r="13" fill="#fff" stroke="#9ed9ef" stroke-width="4"/>
    <path d="M225 176c40-31 94-38 139-17" fill="none" stroke="#7b6ab2" stroke-width="8" stroke-linecap="round"/>
    <path d="m350 143 23 20-27 13" fill="none" stroke="#7b6ab2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M413 300c-39 24-91 23-130 0" fill="none" stroke="#7b6ab2" stroke-width="8" stroke-linecap="round"/>
    <path d="m296 286-23 17 24 16" fill="none" stroke="#7b6ab2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  if(kind==='rinsing-hands') cue=`
    <path d="M413 198v55" stroke="#56b7e9" stroke-width="12" stroke-linecap="round"/>
    <path d="M392 209v43M434 211v42" stroke="#8bd4f4" stroke-width="8" stroke-linecap="round"/>
    <circle cx="287" cy="214" r="11" fill="#fff" stroke="#9ed9ef" stroke-width="4"/><circle cx="326" cy="204" r="9" fill="#fff" stroke="#9ed9ef" stroke-width="4"/>
    <path d="M278 273c35 18 76 20 112 4" fill="none" stroke="#58bde8" stroke-width="7" stroke-linecap="round" stroke-dasharray="10 11"/>
    <path d="m380 264 20 10-15 18" fill="none" stroke="#58bde8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  return frame(`${faucet()}${hands()}${cue}`,'#f5fbff','#d5e8f5');
}

function hotSurface(){return `
  <rect x="407" y="182" width="138" height="101" rx="20" fill="#646d7d" stroke="#424957" stroke-width="6"/>
  <circle cx="448" cy="215" r="23" fill="#ef6a58"/><circle cx="505" cy="215" r="23" fill="#ef6a58"/>
  <path d="M440 160c-17-19 16-24 0-45M480 160c-17-19 16-24 0-45M520 160c-17-19 16-24 0-45" fill="none" stroke="#ef7e55" stroke-width="9" stroke-linecap="round"/>
`;}

function safetySvg(kind){
  let scene=hotSurface();
  if(kind==='safe-distance-from-hot-surface') scene+=`
    <circle cx="159" cy="131" r="40" fill="#f3b482"/><path d="M126 125c5-37 58-49 74-17-13-9-26-13-39-11-13 2-24 10-35 28Z" fill="#4a302f"/>
    <path d="M131 174c17-16 46-16 63 0l20 85h-103Z" fill="#d985b7"/>
    <path d="M312 89v207" stroke="#6fbd85" stroke-width="10" stroke-linecap="round" stroke-dasharray="15 15"/>
    <path d="M263 105h38M263 280h38" stroke="#6fbd85" stroke-width="8" stroke-linecap="round"/>
    <path d="M221 194h57" stroke="#6fbd85" stroke-width="9" stroke-linecap="round"/><path d="m231 176-22 18 22 18" fill="none" stroke="#6fbd85" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  if(kind==='touching-hot-surface') scene+=`
    <path d="M105 242c92-23 171-34 282-31" fill="none" stroke="#f3b482" stroke-width="34" stroke-linecap="round"/>
    <path d="M369 210c13-22 27-36 42-43M374 221c22-16 38-23 53-24" fill="none" stroke="#f3b482" stroke-width="15" stroke-linecap="round"/>
    <path d="M154 84 206 174H102Z" fill="#f05d5d"/><rect x="149" y="111" width="10" height="37" rx="5" fill="#fff"/><circle cx="154" cy="158" r="7" fill="#fff"/>
    <path d="M359 184c14-19 28-26 42-22" fill="none" stroke="#e84f4f" stroke-width="8" stroke-linecap="round"/>
  `;
  if(kind==='playing-near-hot-surface') scene+=`
    <circle cx="180" cy="239" r="54" fill="#7aa6df" stroke="#4e79b5" stroke-width="6"/><path d="M141 205c25 18 52 20 79 5M147 270c25-17 51-17 77 0M180 185v108" fill="none" stroke="#fff" stroke-width="7"/>
    <rect x="267" y="238" width="55" height="55" rx="10" fill="#f2bd55" transform="rotate(12 295 266)"/>
    <path d="M112 104 330 322M330 104 112 322" stroke="#e65353" stroke-width="14" stroke-linecap="round" opacity=".92"/>
  `;
  return frame(scene,'#fff9f6','#f0ded7');
}

function toyBlock(x,y,fill,rotate=0){return `<rect x="${x}" y="${y}" width="48" height="48" rx="9" fill="${fill}" transform="rotate(${rotate} ${x+24} ${y+24})"/>`;}
function toyBox(){return `<path d="M394 207h151l-16 101H410Z" fill="#c9905d" stroke="#9c6840" stroke-width="6"/><path d="M384 207h170" stroke="#9c6840" stroke-width="14" stroke-linecap="round"/>`;}

function cleanupSvg(kind){
  let scene='';
  if(kind==='helping-tidy') scene=`
    ${toyBox()}${toyBlock(133,225,'#6da5df',-8)}${toyBlock(199,245,'#efad57',7)}
    <path d="M112 125c64-4 126 12 192 60" fill="none" stroke="#f3b482" stroke-width="32" stroke-linecap="round"/>
    <rect x="294" y="163" width="49" height="49" rx="9" fill="#79b989" transform="rotate(14 319 188)"/>
    <path d="M335 185c45 11 81 31 109 59" fill="none" stroke="#64b57a" stroke-width="9" stroke-linecap="round"/>
    <path d="m427 222 27 31-39 4" fill="none" stroke="#64b57a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  if(kind==='leaving-mess') scene=`
    ${toyBlock(107,239,'#6da5df',-12)}${toyBlock(185,214,'#efad57',10)}${toyBlock(262,251,'#79b989',-5)}${toyBlock(340,223,'#d982ad',12)}
    <circle cx="493" cy="108" r="36" fill="#f3b482"/><path d="M463 145c18-15 43-15 60 0l19 83h-98Z" fill="#8b87ca"/>
    <path d="M486 229 461 292M516 229l28 60" stroke="#59667d" stroke-width="20" stroke-linecap="round"/>
    <path d="M408 127c-45 0-76 12-105 36" fill="none" stroke="#8b87ca" stroke-width="8" stroke-linecap="round" stroke-dasharray="12 12"/>
    <path d="m318 144-27 27 38 6" fill="none" stroke="#8b87ca" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  if(kind==='scattering-toys') scene=`
    <g transform="rotate(-20 170 238)"><path d="M92 191h141l-14 96H106Z" fill="#c9905d" stroke="#9c6840" stroke-width="6"/><path d="M84 191h158" stroke="#9c6840" stroke-width="14" stroke-linecap="round"/></g>
    ${toyBlock(292,111,'#6da5df',20)}${toyBlock(382,172,'#efad57',-15)}${toyBlock(464,242,'#79b989',12)}${toyBlock(306,259,'#d982ad',-9)}
    <path d="M226 185c44-50 87-72 129-75M239 224c68-12 124 1 173 35M229 258c38 34 82 48 130 47" fill="none" stroke="#e06767" stroke-width="8" stroke-linecap="round"/>
    <path d="m345 92 25 12-17 23M401 240l27 24-34 10M349 287l24 19-29 12" fill="none" stroke="#e06767" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  return frame(scene,'#fffaf6','#eddfd5');
}

export function createMashaalSemanticChoiceVisual(kind,options={}){
  const el=host(kind,options);
  if(['hands-under-water','soap-on-hands','rubbing-hands','rinsing-hands'].includes(kind))el.innerHTML=handwashingSvg(kind);
  else if(['safe-distance-from-hot-surface','touching-hot-surface','playing-near-hot-surface'].includes(kind))el.innerHTML=safetySvg(kind);
  else if(['helping-tidy','leaving-mess','scattering-toys'].includes(kind))el.innerHTML=cleanupSvg(kind);
  else return null;
  return el;
}
