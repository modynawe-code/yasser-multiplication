import { createGameRegistry } from './core/game-registry.js';

export const gameRegistry=createGameRegistry([
  {
    id:'xo',
    title:'إكس أو',
    category:'hybrid',
    playModes:['solo','local','online'],
    networkMode:'turn-based',
    learningMode:'adaptive',
    minPlayers:1,
    maxPlayers:2,
    version:1,
    metadata:{accent:'duo',description:'لعبة أدوار يمكن ربط الحركة فيها بسؤال مناسب لمستوى كل طفل.'}
  },
  {
    id:'rock-paper-scissors',
    title:'حجر ورق مقص',
    category:'fun',
    playModes:['solo','local','online'],
    networkMode:'simultaneous',
    learningMode:'optional',
    minPlayers:1,
    maxPlayers:2,
    version:1,
    load:()=>import('./rps/rps-controller.js'),
    metadata:{accent:'duo',description:'لعبة مرح سريعة. الاختيار سري، وأول واحد يوصل 3 يفوز.'}
  },
  {
    id:'number-race',
    title:'سباق الحساب',
    category:'educational',
    playModes:['solo','online','coop'],
    networkMode:'realtime',
    learningMode:'required',
    minPlayers:1,
    maxPlayers:2,
    version:1,
    metadata:{accent:'duo',description:'كل إجابة صحيحة تدفع شخصية اللاعب خطوة في السباق.'}
  },
  {
    id:'king-inspector-thief-executioner',
    title:'الملك والمفتش',
    category:'fun',
    playModes:['online'],
    networkMode:'turn-based',
    learningMode:'optional',
    minPlayers:4,
    maxPlayers:4,
    version:1,
    load:()=>import('./king-inspector/king-inspector-controller.js'),
    metadata:{accent:'royal',description:'أربعة أدوار سرّية، سؤال الملك، واختيار المفتش — مين يكشف اللص؟'}
  }
]);
