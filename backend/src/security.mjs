const encoder=new TextEncoder();
const PBKDF2_ITERATIONS=210000;

function bytesToBase64Url(bytes){
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(value){
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');
  const binary=atob(normalized);return Uint8Array.from(binary,char=>char.charCodeAt(0));
}
export function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
export function validatePassword(value){return /^\d{6}$/.test(String(value||''));}
export function randomId(prefix='id'){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return `${prefix}_${bytesToBase64Url(bytes)}`;}
export function randomSessionToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return bytesToBase64Url(bytes);}
export async function sha256Base64Url(value){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(String(value)));return bytesToBase64Url(new Uint8Array(digest));}
async function derivePasswordRecord(password,{salt,iterations=PBKDF2_ITERATIONS}={}){
  const saltBytes=salt?base64UrlToBytes(salt):crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',encoder.encode(String(password)), 'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBytes,iterations},key,256);
  return{salt:bytesToBase64Url(saltBytes),hash:bytesToBase64Url(new Uint8Array(bits)),iterations};
}
export async function hashPassword(password,options={}){
  if(!validatePassword(password))throw new Error('Parent PIN must be exactly 6 digits');
  return derivePasswordRecord(password,options);
}
export async function verifyPassword(password,stored){
  if(!stored?.salt||!stored?.hash||!stored?.iterations)return false;
  try{
    const candidate=await derivePasswordRecord(password,{salt:stored.salt,iterations:Number(stored.iterations)});
    const left=base64UrlToBytes(candidate.hash),right=base64UrlToBytes(stored.hash);
    if(left.length!==right.length)return false;
    let diff=0;for(let i=0;i<left.length;i++)diff|=left[i]^right[i];return diff===0;
  }catch{return false;}
}
export const SECURITY_DEFAULTS=Object.freeze({passwordIterations:PBKDF2_ITERATIONS,sessionTtlDays:30,maxLoginFailures:5,loginWindowMinutes:15});
