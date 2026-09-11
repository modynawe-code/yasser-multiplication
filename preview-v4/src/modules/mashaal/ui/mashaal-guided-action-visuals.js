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

function drinkWaterSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#f7fbff" stroke="#dbe8f5" stroke-width="4"/>
    <circle cx="278" cy="122" r="62" fill="#f3b482"/>
    <path d="M219 119c2-61 101-83 128-24-23-17-48-25-72-22-23 3-41 17-56 46Z" fill="#4a302f"/>
    <circle cx="231" cy="77" r="24" fill="#4a302f"/><path d="M214 64l17-18 18 19-17 9Z" fill="#bb6ca7"/>
    <circle cx="263" cy="120" r="6" fill="#2c2831"/><circle cx="294" cy="118" r="6" fill="#2c2831"/>
    <path d="M299 145c8 4 15 4 23 0" stroke="#a14f58" stroke-width="6" stroke-linecap="round"/>
    <path d="M227 185c31-29 95-31 126 1l24 111H202Z" fill="#d985b7"/>
    <path d="M345 195c30 8 47 26 57 52" stroke="#f3b482" stroke-width="24" stroke-linecap="round"/>
    <g transform="translate(397 110) rotate(-23 45 95)">
      <rect x="17" y="42" width="62" height="142" rx="22" fill="#74bdf0" stroke="#3b86bd" stroke-width="6"/>
      <rect x="30" y="18" width="36" height="30" rx="9" fill="#6a55aa"/>
      <rect x="35" y="4" width="26" height="20" rx="8" fill="#8a73c5"/>
      <path d="M28 83h40M28 105h40M28 127h40" stroke="#d9f2ff" stroke-width="6" stroke-linecap="round"/>
    </g>
    <path d="M389 170c-29-1-48-4-68-18" stroke="#f3b482" stroke-width="20" stroke-linecap="round"/>
    <path d="M374 142c-16 7-29 15-38 26" stroke="#60aee3" stroke-width="8" stroke-linecap="round"/>
    <path d="M351 139c9-13 18-13 27 0-9 15-18 15-27 0Z" fill="#72c7f2"/>
    <circle cx="503" cy="83" r="28" fill="#eef8ff"/><path d="M492 84c10-16 20-16 30 0-10 16-20 16-30 0Z" fill="#72c7f2"/>
  </svg>`;
}

function wakeUpSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#fffaf1" stroke="#f0e0bd" stroke-width="4"/>
    <circle cx="517" cy="84" r="40" fill="#f7c84f"/><path d="M517 25v24M517 119v24M458 84h24M552 84h24M475 42l17 17M542 109l17 17M559 42l-17 17M492 109l-17 17" stroke="#efb92f" stroke-width="8" stroke-linecap="round"/>
    <rect x="101" y="219" width="425" height="74" rx="28" fill="#91b9e2"/>
    <rect x="108" y="187" width="128" height="54" rx="24" fill="#fff" stroke="#dae5f0" stroke-width="4"/>
    <circle cx="246" cy="176" r="48" fill="#f3b482"/>
    <path d="M205 171c4-43 69-60 91-19-17-11-33-16-49-14-17 2-29 12-42 33Z" fill="#4a302f"/>
    <circle cx="214" cy="139" r="19" fill="#4a302f"/><path d="M202 128l14-15 15 16-15 7Z" fill="#bb6ca7"/>
    <circle cx="234" cy="177" r="5" fill="#2c2831"/><circle cx="258" cy="175" r="5" fill="#2c2831"/>
    <path d="M235 194c8 7 16 7 24 0" stroke="#a14f58" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M286 203c27-13 56-18 84-13" stroke="#f3b482" stroke-width="22" stroke-linecap="round"/>
    <rect x="426" y="197" width="78" height="56" rx="16" fill="#fff" stroke="#d9c8dc" stroke-width="4"/>
    <circle cx="465" cy="226" r="17" fill="#d981ae"/><path d="M465 212v15l11 8" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
  </svg>`;
}

function brushTeethSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#f7fbff" stroke="#dbe8f5" stroke-width="4"/>
    <rect x="392" y="76" width="154" height="156" rx="28" fill="#eaf6ff" stroke="#b9d8ed" stroke-width="5"/>
    <circle cx="266" cy="128" r="61" fill="#f3b482"/>
    <path d="M210 124c3-57 91-78 123-26-23-15-44-21-65-18-20 3-39 17-58 44Z" fill="#4a302f"/>
    <circle cx="223" cy="84" r="23" fill="#4a302f"/><path d="M207 71l17-17 18 18-18 8Z" fill="#bb6ca7"/>
    <circle cx="250" cy="126" r="6" fill="#2c2831"/><circle cx="282" cy="123" r="6" fill="#2c2831"/>
    <path d="M274 151c14 10 28 10 42 0" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M214 193c33-24 91-24 122 0l20 105H194Z" fill="#d985b7"/>
    <path d="M292 151 435 174" stroke="#5b9ed8" stroke-width="14" stroke-linecap="round"/>
    <rect x="427" y="162" width="88" height="24" rx="10" fill="#75b5e7"/><path d="M495 162v-18M483 162v-18M471 162v-18" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <circle cx="315" cy="148" r="9" fill="#fff"/><circle cx="330" cy="139" r="7" fill="#fff"/><circle cx="344" cy="151" r="6" fill="#fff"/>
    <path d="M405 257h148c0 36-30 58-74 58s-74-22-74-58Z" fill="#c7e3f4" stroke="#94c4df" stroke-width="4"/>
    <path d="M480 232v25" stroke="#7ba8c0" stroke-width="10" stroke-linecap="round"/>
  </svg>`;
}

function breakfastSvg(){
  return `<svg viewBox="0 0 640 360" xmlns="${SVG_NS}" role="presentation" focusable="false">
    <rect x="18" y="18" width="604" height="324" rx="34" fill="#fffaf4" stroke="#efe1cf" stroke-width="4"/>
    <circle cx="258" cy="113" r="57" fill="#f3b482"/>
    <path d="M207 110c3-52 84-72 114-24-20-14-41-20-59-17-19 3-36 15-55 41Z" fill="#4a302f"/>
    <circle cx="220" cy="72" r="22" fill="#4a302f"/><path d="M205 59l16-16 17 17-17 7Z" fill="#bb6ca7"/>
    <circle cx="242" cy="112" r="5" fill="#2c2831"/><circle cx="272" cy="110" r="5" fill="#2c2831"/>
    <path d="M246 137c10 8 21 8 31 0" stroke="#a14f58" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M209 170c31-20 79-20 105 0l20 74H193Z" fill="#d985b7"/>
    <rect x="82" y="238" width="476" height="54" rx="20" fill="#d5a873"/>
    <ellipse cx="383" cy="240" rx="92" ry="28" fill="#fff" stroke="#d6dde5" stroke-width="4"/>
    <ellipse cx="382" cy="236" rx="38" ry="22" fill="#fff7df"/><circle cx="382" cy="235" r="15" fill="#f2bd3f"/>
    <path d="M321 225 347 196 378 225Z" fill="#d89b5b"/><path d="M328 222 347 205 366 222" stroke="#f6d7a3" stroke-width="7"/>
    <rect x="459" y="190" width="58" height="50" rx="12" fill="#bfe7f6" stroke="#8cc9df" stroke-width="4"/><path d="M517 204h15c18 0 18 24 0 24h-15" fill="none" stroke="#8cc9df" stroke-width="5"/>
    <path d="M313 185c23 8 40 22 52 41" stroke="#f3b482" stroke-width="20" stroke-linecap="round"/>
    <path d="M357 208 389 185" stroke="#7c8192" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="394" cy="181" rx="13" ry="7" fill="#9ca2b3"/>
  </svg>`;
}

export function createMashaalGuidedActionVisual(kind,options={}){
  const host=svgHost(kind,options);
  if(kind==='balance-one-foot')host.innerHTML=balanceSvg();
  else if(kind==='transfer-three-safe-pieces')host.innerHTML=fineMotorSvg();
  else if(kind==='child-drinking-water')host.innerHTML=drinkWaterSvg();
  else if(kind==='wake-up')host.innerHTML=wakeUpSvg();
  else if(kind==='brushing-teeth')host.innerHTML=brushTeethSvg();
  else if(kind==='eating-breakfast')host.innerHTML=breakfastSvg();
  else return null;
  return host;
}
