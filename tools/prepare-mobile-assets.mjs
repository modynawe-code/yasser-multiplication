import { mkdir,readFile,writeFile,unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT=resolve(new URL('..',import.meta.url).pathname);
const ASSET_DIR=resolve(ROOT,'mobile-assets');
const ICON_PNG=resolve(ASSET_DIR,'icon.png');
const ICON_SVG=resolve(ASSET_DIR,'icon.svg');
const YASSER=resolve(ROOT,'preview-v4/assets/visual/original/yasser/welcome.png');
const KHALED=resolve(ROOT,'preview-v4/assets/visual/original/khaled/khaled-thumbsup.png');
const CALCULATOR=resolve(ROOT,'preview-v4/assets/visual/original/assistant/thinking.png');

function pngData(buffer){
  const signature=buffer.subarray(0,8).toString('hex');
  if(signature!=='89504e470d0a1a0a')throw new Error('Launcher icon source is not a valid PNG');
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const [yasser,khaled,calculator]=await Promise.all([readFile(YASSER),readFile(KHALED),readFile(CALCULATOR)]);
const yasserUri=pngData(yasser),khaledUri=pngData(khaled),calculatorUri=pngData(calculator);

const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071d53"/><stop offset=".48" stop-color="#064fb7"/><stop offset="1" stop-color="#031846"/></linearGradient>
  <radialGradient id="orange"><stop stop-color="#ffb72e" stop-opacity=".86"/><stop offset=".72" stop-color="#ff6b00" stop-opacity=".2"/><stop offset="1" stop-color="#ff6b00" stop-opacity="0"/></radialGradient>
  <radialGradient id="blue"><stop stop-color="#5ec5ff" stop-opacity=".8"/><stop offset=".72" stop-color="#087cff" stop-opacity=".18"/><stop offset="1" stop-color="#087cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="center"><stop stop-color="#fff5be" stop-opacity=".55"/><stop offset="1" stop-color="#ffd33d" stop-opacity="0"/></radialGradient>
  <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#00102f" flood-opacity=".5"/></filter>
  <filter id="mascotShadow"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#00102f" flood-opacity=".58"/></filter>
  <clipPath id="safe"><rect x="28" y="28" width="968" height="968" rx="205"/></clipPath>
</defs>
<g clip-path="url(#safe)">
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="235" cy="390" r="405" fill="url(#orange)"/>
  <circle cx="790" cy="380" r="420" fill="url(#blue)"/>
  <circle cx="512" cy="660" r="260" fill="url(#center)"/>
  <path d="M72 800 C245 704 380 726 512 800 C650 724 790 700 952 800 L952 1024 L72 1024Z" fill="#01163e" opacity=".8"/>
  <image href="${khaledUri}" x="-42" y="112" width="535" height="790" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>
  <image href="${yasserUri}" x="535" y="112" width="535" height="790" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>
  <g fill="#ffd83d" stroke="#ff9b00" stroke-width="5">
    <path d="M512 52l15 33 36 4-27 25 8 36-32-18-32 18 8-36-27-25 36-4z"/>
    <path d="M105 94l10 22 25 3-19 17 6 25-22-13-22 13 6-25-19-17 25-3z"/>
    <path d="M913 94l10 22 25 3-19 17 6 25-22-13-22 13 6-25-19-17 25-3z"/>
  </g>
  <image href="${calculatorUri}" x="342" y="485" width="340" height="430" preserveAspectRatio="xMidYMid meet" filter="url(#mascotShadow)"/>
</g>
<rect x="28" y="28" width="968" height="968" rx="205" fill="none" stroke="#58baff" stroke-width="18"/>
</svg>`;

await mkdir(ASSET_DIR,{recursive:true});
await unlink(ICON_PNG).catch(()=>{});
await writeFile(ICON_SVG,svg,'utf8');
console.log(`Android launcher source ready: ${ICON_SVG}`);
