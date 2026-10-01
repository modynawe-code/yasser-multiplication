import { createOnlineGameSession } from '../online/game-online-session.js';

export function createMonopolyOnlineSession({roomClient,onRoom,onError,pollIntervalMs=1100,resumeStore,autoPoll=true}={}){
  const session=createOnlineGameSession({gameId:'family-monopoly',roomClient,onRoom,onError,pollIntervalMs,resumeStore,autoPoll});
  return Object.freeze({
    create(learnerId,options){return session.create(learnerId,options);},
    join(code,learnerId,options){return session.join(code,learnerId,options);},
    submit(type,payload){return session.submit(type,payload);},
    start(){return session.submit('start');},
    refresh(){return session.refresh();},
    resume(options){return session.resume(options);},
    hasResume(learnerId=null){return session.hasResume(learnerId);},
    stop(options){return session.stop(options);},
    forget(){return session.forget();},
    get snapshot(){return session.snapshot;}
  });
}
