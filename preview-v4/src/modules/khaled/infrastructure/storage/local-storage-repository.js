import { createInitialKhaledState, normalizeKhaledState } from '../../domain/state-model.js';

export const KHALED_STORAGE_KEY='khaled_grade1_math_v1';

export function createKhaledRepository(storage=globalThis.localStorage){
  return{
    load(){
      try{
        const raw=storage?.getItem(KHALED_STORAGE_KEY);
        return normalizeKhaledState(raw?JSON.parse(raw):createInitialKhaledState());
      }catch{return createInitialKhaledState();}
    },
    save(state){
      try{storage?.setItem(KHALED_STORAGE_KEY,JSON.stringify(state));return true;}
      catch{return false;}
    },
    export(state){return JSON.stringify(state,null,2);}
  };
}
