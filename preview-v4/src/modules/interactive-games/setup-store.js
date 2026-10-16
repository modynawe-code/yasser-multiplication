import {normalizeParticipants} from './selection-engine.js';

const STORAGE_KEY='independent-games-setup-v1';

export function loadIndependentGameSetup(storage){
  try{
    const target=storage===undefined?globalThis.localStorage:storage;
    const value=JSON.parse(target?.getItem(STORAGE_KEY)||'{}');
    return{participants:normalizeParticipants(Array.isArray(value.participants)?value.participants:[]),groups:normalizeParticipants(Array.isArray(value.groups)?value.groups:[])};
  }catch{return{participants:[],groups:[]};}
}

export function saveIndependentGameSetup(setup,storage){
  const normalized={participants:normalizeParticipants(Array.isArray(setup?.participants)?setup.participants:[]),groups:normalizeParticipants(Array.isArray(setup?.groups)?setup.groups:[])};
  try{const target=storage===undefined?globalThis.localStorage:storage;target?.setItem(STORAGE_KEY,JSON.stringify(normalized));}catch{/* The current session remains playable if local storage is unavailable. */}
  return normalized;
}

export function independentGameSetupStorageKey(){return STORAGE_KEY;}
