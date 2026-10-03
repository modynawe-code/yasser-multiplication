import { defineGame } from './game-contract.js';

export function createGameRegistry(initialGames=[]){
  const games=new Map();

  function register(definition){
    const game=defineGame(definition);
    if(games.has(game.id))throw new Error(`game already registered: ${game.id}`);
    games.set(game.id,game);
    return game;
  }

  function get(id){return games.get(String(id||''))||null;}

  function list(filters={}){
    const category=filters.category||null;
    const playMode=filters.playMode||null;
    return [...games.values()].filter(game=>{
      if(category&&game.category!==category)return false;
      if(playMode&&!game.playModes.includes(playMode))return false;
      return true;
    });
  }

  function has(id){return games.has(String(id||''));}

  initialGames.forEach(register);
  return Object.freeze({register,get,list,has});
}
