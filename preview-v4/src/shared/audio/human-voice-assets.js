export const HUMAN_VOICE_ROOT='assets/audio/human';

export function normalizeVoiceText(text){
  return String(text||'').normalize('NFC').trim().replace(/\s+/g,' ');
}

function fnv1a64(text){
  let hash=0xcbf29ce484222325n;
  const prime=0x100000001b3n;
  for(let index=0;index<text.length;index++){
    const code=text.charCodeAt(index);
    hash^=BigInt(code&0xff);
    hash=BigInt.asUintN(64,hash*prime);
    hash^=BigInt((code>>>8)&0xff);
    hash=BigInt.asUintN(64,hash*prime);
  }
  return hash.toString(16).padStart(16,'0');
}

export function humanVoiceTextHash(text){
  const normalized=normalizeVoiceText(text);
  return normalized?fnv1a64(normalized):null;
}

export function humanVoiceAssetPath(text,{root=HUMAN_VOICE_ROOT,extension='mp3'}={}){
  const hash=humanVoiceTextHash(text);
  return hash?`${root}/${hash}.${extension}`:null;
}
