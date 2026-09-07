import { mkdir,readFile,writeFile,unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT=resolve(new URL('..',import.meta.url).pathname);
const ASSET_DIR=resolve(ROOT,'mobile-assets');
const ICON_PNG=resolve(ASSET_DIR,'icon.png');
const ICON_SVG=resolve(ASSET_DIR,'icon.svg');
const YASSER=resolve(ROOT,'preview-v4/assets/visual/original/yasser/welcome.png');
const KHALED=resolve(ROOT,'preview-v4/assets/visual/original/khaled/khaled-thumbsup.png');

function pngData(buffer){
  const signature=buffer.subarray(0,8).toString('hex');
  if(signature!=='89504e470d0a1a0a')throw new Error('Launcher icon source is not a valid PNG');
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const [yasser,khaled]=await Promise.all([readFile(YASSER),readFile(KHALED)]);
const yasserUri=pngData(yasser),khaledUri=pngData(khaled);

const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#061f58"/><stop offset=".52" stop-color="#0757c9"/><stop offset="1" stop-color="#031b50"/></linearGradient>
  <radialGradient id="orange"><stop stop-color="#ffb52b" stop-opacity=".72"/><stop offset="1" stop-color="#ff6b00" stop-opacity="0"/></radialGradient>
  <radialGradient id="blue"><stop stop-color="#46b5ff" stop-opacity=".68"/><stop offset="1" stop-color="#0075ff" stop-opacity="0"/></radialGradient>
  <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#00102f" flood-opacity=".45"/></filter>
  <clipPath id="safe"><rect x="28" y="28" width="968" height="968" rx="205"/></clipPath>
</defs>
<g clip-path="url(#safe)">
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="260" cy="360" r="360" fill="url(#orange)"/>
  <circle cx="770" cy="345" r="380" fill="url(#blue)"/>
  <path d="M115 782 C270 700 385 735 512 790 C640 735 760 700 910 782 L910 1024 L115 1024Z" fill="#021841" opacity=".78"/>
  <image href="${khaledUri}" x="-5" y="145" width="505" height="760" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>
  <image href="${yasserUri}" x="524" y="145" width="505" height="760" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>
  <g transform="translate(512 780)" filter="url(#shadow)">
    <circle r="137" fill="#062c78" stroke="#55baff" stroke-width="12"/>
    <circle r="109" fill="#0a61d7" stroke="#ffb426" stroke-width="8"/>
    <text x="0" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="142" font-weight="900" fill="#fff">×</text>
  </g>
  <g fill="#ffd53d" stroke="#ff9a00" stroke-width="5">
    <path d="M504 58l14 31 34 4-25 23 7 34-30-17-30 17 7-34-25-23 34-4z"/>
    <path d="M116 92l10 21 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z"/>
    <path d="M906 92l10 21 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z"/>
  </g>
</g>
<rect x="28" y="28" width="968" height="968" rx="205" fill="none" stroke="#4fb4ff" stroke-width="18"/>
</svg>`;

await mkdir(ASSET_DIR,{recursive:true});
await unlink(ICON_PNG).catch(()=>{});
await writeFile(ICON_SVG,svg,'utf8');
console.log(`Android launcher source ready: ${ICON_SVG}`);
