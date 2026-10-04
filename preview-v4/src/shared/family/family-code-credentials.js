export const FAMILY_CODE_STORAGE_KEY='family-shared-code-v1';
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH=6;

export function normalizeFamilyCode(value){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,CODE_LENGTH);
}

export function isValidFamilyCode(value){
  return normalizeFamilyCode(value).length===CODE_LENGTH;
}

export function generateFamilyCode(cryptoImpl=globalThis.crypto){
  const bytes=new Uint8Array(CODE_LENGTH);
  cryptoImpl.getRandomValues(bytes);
  let code='';
  for(const byte of bytes)code+=ALPHABET[byte%ALPHABET.length];
  return code;
}

export function loadFamilyCode(storage=globalThis.localStorage){
  try{return normalizeFamilyCode(storage?.getItem(FAMILY_CODE_STORAGE_KEY)||'');}catch{return'';}
}

export function saveFamilyCode(value,storage=globalThis.localStorage){
  const code=normalizeFamilyCode(value);
  if(!isValidFamilyCode(code))return false;
  try{storage?.setItem(FAMILY_CODE_STORAGE_KEY,code);return true;}catch{return false;}
}

export function clearFamilyCode(storage=globalThis.localStorage){
  try{storage?.removeItem(FAMILY_CODE_STORAGE_KEY);return true;}catch{return false;}
}

export function formatFamilyCode(value){
  const code=normalizeFamilyCode(value);
  return code;
}

async function sha256Hex(value,cryptoImpl=globalThis.crypto){
  const data=new TextEncoder().encode(String(value));
  const digest=await cryptoImpl.subtle.digest('SHA-256',data);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function deriveFamilyCredentials(value,cryptoImpl=globalThis.crypto){
  const code=normalizeFamilyCode(value);
  if(!isValidFamilyCode(code))throw new Error('invalid_family_code');
  const hash=await sha256Hex(`family-code-v1:${code}`,cryptoImpl);
  return{
    code,
    email:`family-${hash.slice(0,24)}@family.invalid`,
    password:`Family#${hash}`
  };
}
