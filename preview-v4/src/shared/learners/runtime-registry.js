import { createLearnerProfile } from './learner-profile.js';

export function createLearnerRegistry(initialProfiles=[]){
  const profiles=new Map();
  for(const input of initialProfiles){const profile=createLearnerProfile(input);profiles.set(profile.id,profile);}
  return Object.freeze({
    get(id){return profiles.get(String(id||'').trim().toLowerCase())||null;},
    list(){return [...profiles.values()];},
    register(input){const profile=createLearnerProfile(input);if(profiles.has(profile.id))throw new Error('learner already registered');profiles.set(profile.id,profile);return profile;}
  });
}
