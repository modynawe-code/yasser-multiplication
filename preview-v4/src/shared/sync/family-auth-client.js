import { getFamilyApiBase } from '../config/family-api-config.js';

export const FAMILY_AUTH_SESSION_KEY='family_cloud_auth_session_v1';

export function createFamilyAuthClient({baseUrl=getFamilyApiBase(),fetchFn=globalThis.fetch,storage=globalThis.sessionStorage}={}){
  const api=String(baseUrl||'').replace(/\/$/,'');
  function load(){try{return JSON.parse(storage?.getItem(FAMILY_AUTH_SESSION_KEY)||'null');}catch{return null;}}
  function save(value){try{if(value)storage?.setItem(FAMILY_AUTH_SESSION_KEY,JSON.stringify(value));else storage?.removeItem(FAMILY_AUTH_SESSION_KEY);}catch{}}
  async function request(path,{method='GET',body,auth=true}={}){
    if(!api)throw new Error('family_api_not_configured');
    const session=load(),headers={'content-type':'application/json'};
    if(auth){if(!session?.token)throw new Error('family_auth_required');headers.authorization=`Bearer ${session.token}`;}
    const result=await fetchFn(`${api}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    let payload=null;try{payload=await result.json();}catch{}
    if(result.status===401&&auth)save(null);
    if(!result.ok){const error=new Error(payload?.error||`family_api_${result.status}`);error.status=result.status;throw error;}
    return payload;
  }
  async function establish(path,email,password){const payload=await request(path,{method:'POST',body:{email,password},auth:false});save({token:payload.token,expiresAt:payload.expiresAt,email:payload.parent?.email||email});return payload;}
  return{
    isConfigured:()=>Boolean(api),
    getBaseUrl:()=>api,
    getSession:load,
    isAuthenticated:()=>Boolean(load()?.token),
    register:(email,password)=>establish('/v1/auth/register',email,password),
    login:(email,password)=>establish('/v1/auth/login',email,password),
    me:()=>request('/v1/me'),
    request,
    async logout(){try{if(load()?.token)await request('/v1/auth/logout',{method:'POST'});}finally{save(null);}}
  };
}
