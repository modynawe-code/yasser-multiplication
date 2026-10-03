export const CONTENT_STATUS = Object.freeze({DRAFT:'draft',VERIFIED:'verified',RELEASED:'released'});

export function canReleaseContent({status,sourceVerified}={}){
  return status===CONTENT_STATUS.VERIFIED&&sourceVerified===true;
}
