import { createInitialState, normalizeState } from '../../domain/state-model.js';
const PREVIEW_STORAGE_KEY='yasser_mul_v4_preview';
export function createLocalStorageRepository(storage=globalThis.localStorage){return{load(){try{const raw=storage?.getItem(PREVIEW_STORAGE_KEY);return normalizeState(raw?JSON.parse(raw):createInitialState());}catch{return createInitialState();}},save(state){try{storage?.setItem(PREVIEW_STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}},export(state){return JSON.stringify(state,null,2);}};}
