import { MASHAAL_STORAGE_NAMESPACE } from '../domain/constants.js';
import { createInitialMashaalState, normalizeMashaalState } from '../domain/state-model.js';

export function createMashaalLocalStorageRepository(storage=globalThis.localStorage){
  return Object.freeze({
    load(){try{const raw=storage?.getItem(MASHAAL_STORAGE_NAMESPACE);return normalizeMashaalState(raw?JSON.parse(raw):createInitialMashaalState());}catch{return createInitialMashaalState();}},
    save(state){try{storage?.setItem(MASHAAL_STORAGE_NAMESPACE,JSON.stringify(normalizeMashaalState(state)));return true;}catch{return false;}}
  });
}
