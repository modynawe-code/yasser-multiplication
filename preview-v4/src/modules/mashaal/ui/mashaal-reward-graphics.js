const SHAPES=Object.freeze({
  'attempt-flower':'<g class="fill"><circle cx="60" cy="34" r="16"/><circle cx="86" cy="52" r="16"/><circle cx="76" cy="82" r="16"/><circle cx="44" cy="82" r="16"/><circle cx="34" cy="52" r="16"/></g><circle class="accent" cx="60" cy="60" r="15"/>',
  'progress-butterfly':'<path class="fill" d="M57 58C39 18 12 27 20 57c4 15 19 17 36 8-14 15-19 34-4 38 13 4 19-18 12-37z"/><path class="fill" d="M63 58c18-40 45-31 37-1-4 15-19 17-36 8 14 15 19 34 4 38-13 4-19-18-12-37z"/><path class="accent" d="M60 43c5 0 8 8 8 19s-3 27-8 27-8-16-8-27 3-19 8-19z"/>',
  'consistency-star':'<path class="fill" d="m60 14 13 28 31 4-23 22 6 32-27-16-27 16 6-32-23-22 31-4z"/><circle class="accent" cx="60" cy="60" r="11"/>',
  'cooperation-heart':'<path class="fill" d="M60 101C48 88 18 70 18 44c0-18 22-27 42-8 20-19 42-10 42 8 0 26-30 44-42 57z"/><path class="accent stroke" d="M40 62c8-6 14-6 20 0 6-6 12-6 20 0"/>',
  'distinction-crown':'<path class="fill" d="M18 39 42 57 59 24 78 57l24-18-10 52H28z"/><rect class="accent" x="31" y="82" width="58" height="12" rx="6"/>',
  'achievement-ribbon':'<circle class="fill" cx="60" cy="50" r="33"/><path class="accent" d="M40 74 31 108l29-16 29 16-9-34z"/><path class="cut" d="m60 28 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"/>',
  'persistence-pearl':'<circle class="fill" cx="60" cy="53" r="31"/><path class="accent" d="M26 81c10 15 58 20 68 0-3 24-17 31-34 31S29 105 26 81z"/><circle class="shine" cx="48" cy="42" r="8"/>',
  'variety-rainbow':'<path class="stroke wide" d="M16 86a44 44 0 0 1 88 0"/><path class="accent stroke mid" d="M29 86a31 31 0 0 1 62 0"/><path class="soft stroke thin" d="M42 86a18 18 0 0 1 36 0"/><circle class="fill" cx="20" cy="88" r="11"/><circle class="fill" cx="100" cy="88" r="11"/>',
  'surprise-box':'<rect class="fill" x="23" y="48" width="74" height="55" rx="8"/><rect class="accent" x="16" y="38" width="88" height="20" rx="8"/><path class="cut" d="M54 38v65h12V38z"/><path class="stroke" d="M60 38C40 30 36 15 47 15c9 0 13 9 13 23Zm0 0c20-8 24-23 13-23-9 0-13 9-13 23Z"/>',
  'cup':'<path class="fill" d="M36 19h48v28c0 20-9 31-24 35-15-4-24-15-24-35z"/><path class="stroke" d="M36 31H19c0 20 6 29 22 31m43-31h17c0 20-6 29-22 31"/><rect class="accent" x="54" y="80" width="12" height="15"/><rect class="fill" x="39" y="93" width="42" height="12" rx="6"/>',
  'courage-star':'<path class="fill" d="m60 13 12 29 31 4-23 20 8 31-28-17-28 17 8-31-23-20 31-4z"/><path class="accent stroke" d="m45 61 10 10 22-25"/>',
  'magic-wand':'<path class="stroke wide" d="m29 96 52-52"/><path class="fill" d="m85 14 7 17 18 2-14 12 4 18-15-9-16 9 5-18-14-12 18-2z"/><circle class="accent" cx="28" cy="41" r="7"/><circle class="accent" cx="95" cy="84" r="6"/>'
});

function shapeKey(graphicKey){return String(graphicKey||'').split('.').pop()||'';}

export function mashaalRewardGraphicMarkup(graphicKey,{locked=false}={}){
  const key=shapeKey(graphicKey),shape=SHAPES[key]||SHAPES['consistency-star'];
  return `<span class="mashaal-treasure-graphic ${locked?'locked':''}" data-mashaal-reward-art="${key}" aria-hidden="true"><svg viewBox="0 0 120 120" focusable="false">${shape}</svg></span>`;
}

export function hasMashaalRewardGraphic(graphicKey){return Object.prototype.hasOwnProperty.call(SHAPES,shapeKey(graphicKey));}
