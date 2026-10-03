import { isGameEvent } from './game-event-contract.js';

export function createGameEventBus(){
  const listeners=new Set();

  function subscribe(listener){
    if(typeof listener!=='function')throw new TypeError('game event listener must be a function');
    listeners.add(listener);
    return()=>listeners.delete(listener);
  }

  function publish(event){
    if(!isGameEvent(event))throw new TypeError('valid game event is required');
    for(const listener of [...listeners]){try{listener(event);}catch{}}
    return event;
  }

  function clear(){listeners.clear();}
  return Object.freeze({subscribe,publish,clear,size:()=>listeners.size});
}

export const gameEventBus=createGameEventBus();
