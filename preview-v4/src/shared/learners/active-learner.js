import { normalizeLearnerId } from './learner-id.js';

export function createActiveLearnerState(initialId=null){
  let activeLearnerId=normalizeLearnerId(initialId);
  return Object.freeze({
    get(){return activeLearnerId;},
    set(value){const id=normalizeLearnerId(value);if(!id)return false;activeLearnerId=id;return true;},
    clear(){activeLearnerId=null;}
  });
}
