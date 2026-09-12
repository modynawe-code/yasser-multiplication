import { createGameRegistry } from './core/game-registry.js';

const cardArt=(src)=>`<img src="${src}" alt="" decoding="async" style="display:block;width:min(100%,360px);aspect-ratio:4/3;object-fit:cover;border-radius:18px;margin-inline:auto;background:#f2f4f7">`;

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
    metadata:{accent:'duo',icon:cardArt('assets/games/catalog/xo-card.webp'),availabilityLabel:'محلي + أونلاين',description:'لعبة أدوار يمكن ربط الحركة فيها بسؤال مناسب لمستوى كل طفل.'}
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
    metadata:{accent:'duo',icon:cardArt('assets/games/catalog/rps-card.webp'),availabilityLabel:'محلي + أونلاين',description:'لعبة مرح سريعة. الاختيار سري، وأول واحد يوصل 3 يفوز.'}
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
    metadata:{accent:'duo',icon:cardArt('assets/games/catalog/number-race-card.webp'),availabilityLabel:'قريبًا',description:'كل إجابة صحيحة تدفع شخصية اللاعب خطوة في السباق.'}
  }
]);
