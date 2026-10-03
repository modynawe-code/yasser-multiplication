const PARENT_PIN_SHA256='ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf';
const MAX_FAILURES=5;
const LOCK_MS=30_000;

async function sha256(value){
  const bytes=new TextEncoder().encode(String(value));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

export function createParentAccessGate({now=()=>Date.now()}={}){
  let failures=0;
  let lockedUntil=0;

  return{
    remainingLockMs(){return Math.max(0,lockedUntil-now());},
    async verify(pin){
      if(now()<lockedUntil)return{ok:false,locked:true,remainingMs:lockedUntil-now()};
      const ok=(await sha256(pin))===PARENT_PIN_SHA256;
      if(ok){failures=0;lockedUntil=0;return{ok:true,locked:false,remainingMs:0};}
      failures+=1;
      if(failures>=MAX_FAILURES){failures=0;lockedUntil=now()+LOCK_MS;return{ok:false,locked:true,remainingMs:LOCK_MS};}
      return{ok:false,locked:false,remainingMs:0,attemptsLeft:MAX_FAILURES-failures};
    }
  };
}
