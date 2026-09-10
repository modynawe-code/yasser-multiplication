const SVG_NS='http://www.w3.org/2000/svg';

function svgHost(kind,{compact=false}={}){
  const host=document.createElement('span');
  host.className=`mashaal-guided-action-art${compact?' compact':''}`;
  host.dataset.guidedVisual=kind;
  host.setAttribute('aria-hidden','true');
  return host;
}

function balanceSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#fff8fc" stroke="#ead8e8" stroke-width="4"/>
    <ellipse cx="320" cy="308" rx="150" ry="22" fill="#e5eefb"/>
    <rect x="218" y="286" width="204" height="18" rx="9" fill="#8fb1df"/>
    <circle cx="320" cy="91" r="42" fill="#f4b07d"/>
    <path d="M282 84c9-39 70-54 83-4-14-13-27-19-43-18-17 1-29 8-40 22Z" fill="#49302f"/>
    <path d="M287 137c13-18 54-18 67 0l18 83c-29 20-76 20-105 0Z" fill="#d681b5"/>
    <path d="M287 156 220 210" stroke="#f4b07d" stroke-width="18" stroke-linecap="round"/>
    <path d="M353 156 420 210" stroke="#f4b07d" stroke-width="18" stroke-linecap="round"/>
    <path d="M293 220 284 287" stroke="#536b95" stroke-width="24" stroke-linecap="round"/>
    <path d="M346 220 386 260 410 244" stroke="#536b95" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M273 289h39" stroke="#4b3f62" stroke-width="15" stroke-linecap="round"/>
    <path d="M404 244h34" stroke="#4b3f62" stroke-width="15" stroke-linecap="round"/>
    <path d="M196 192c-18 7-32 18-43 33M444 192c18 7 32 18 43 33" stroke="#e3a63d" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="319" cy="90" r="5" fill="#312934"/><circle cx="338" cy="90" r="5" fill="#312934"/>
    <path d="M320 107c9 8 19 8 28 0" stroke="#8d4a4a" stroke-width="5" stroke-linecap="round" fill="none"/>
  </svg>`;
}

function fineMotorSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#fbfbff" stroke="#dfe2f1" stroke-width="4"/>
    <ellipse cx="184" cy="273" rx="110" ry="46" fill="#b9d5ef"/><path d="M84 258c19 70 181 70 200 0" fill="#91bddf"/>
    <ellipse cx="470" cy="273" rx="110" ry="46" fill="#f2c2d5"/><path d="M370 258c19 70 181 70 200 0" fill="#df9fba"/>
    <circle cx="151" cy="242" r="22" fill="#f2b84b"/><circle cx="198" cy="233" r="22" fill="#78b88b"/><circle cx="236" cy="252" r="22" fill="#d980a8"/>
    <path d="M270 120c39-10 84 0 119 28l40 31-26 35-52-29-35 14-47-24c-26-13-26-46 1-55Z" fill="#f4b07d"/>
    <path d="M306 126c6-28 42-29 49-5l11 40" stroke="#f4b07d" stroke-width="24" stroke-linecap="round" fill="none"/>
    <circle cx="358" cy="181" r="22" fill="#78b88b" stroke="#fff" stroke-width="5"/>
    <path d="M299 225c44 22 93 26 133 9" stroke="#7b6ab2" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 13" fill="none"/>
    <path d="m430 219 27 9-21 19" fill="none" stroke="#7b6ab2" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function createMashaalGuidedActionVisual(kind,options={}){
  const host=svgHost(kind,options);
  if(kind==='balance-one-foot')host.innerHTML=balanceSvg();
  else if(kind==='transfer-three-safe-pieces')host.innerHTML=fineMotorSvg();
  else return null;
  return host;
}
