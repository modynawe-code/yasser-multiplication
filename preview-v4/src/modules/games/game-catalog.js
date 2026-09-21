import { createGameRegistry } from './core/game-registry.js';

const cardArt=(src)=>`<img src="${src}" alt="" decoding="async" style="display:block;width:min(100%,360px);aspect-ratio:4/3;object-fit:cover;border-radius:18px;margin-inline:auto;background:#f2f4f7">`;
const familyPuzzleArt=()=>`<span aria-hidden="true" style="display:grid;grid-template-columns:repeat(3,1fr);align-items:end;gap:6px;width:min(100%,360px);aspect-ratio:4/3;border-radius:18px;margin-inline:auto;background:linear-gradient(145deg,#f4f7ff,#fff4ed);padding:14px 16px 10px;box-sizing:border-box;overflow:hidden">
  <img src="assets/mashaal/domains/language.webp" alt="" decoding="async" style="width:100%;height:100%;object-fit:contain;object-position:center bottom">
  <img src="assets/visual/original/khaled/khaled-point-thumbsup.png" alt="" decoding="async" style="width:100%;height:100%;object-fit:contain;object-position:center bottom">
  <img src="assets/visual/original/yasser/welcome.png" alt="" decoding="async" style="width:100%;height:100%;object-fit:contain;object-position:center bottom">
</span>`;
const dominoArt=()=>`<span aria-hidden="true" style="display:flex;align-items:center;justify-content:center;gap:10px;width:min(100%,360px);aspect-ratio:4/3;border-radius:18px;margin-inline:auto;background:#12372a;padding:18px;box-sizing:border-box">
  <span style="display:grid;grid-template-columns:1fr 1fr;width:112px;height:56px;background:#fffaf0;border:3px solid #1c1c1c;border-radius:12px;box-shadow:0 8px 18px #0005;transform:rotate(-8deg);overflow:hidden">
    <b style="display:grid;place-items:center;font:800 24px/1 system-ui;color:#151515;border-inline-end:2px solid #222">6</b><b style="display:grid;place-items:center;font:800 24px/1 system-ui;color:#151515">4</b>
  </span>
  <span style="display:grid;grid-template-columns:1fr 1fr;width:96px;height:48px;background:#fffaf0;border:3px solid #1c1c1c;border-radius:11px;box-shadow:0 8px 18px #0005;transform:rotate(10deg);overflow:hidden">
    <b style="display:grid;place-items:center;font:800 21px/1 system-ui;color:#151515;border-inline-end:2px solid #222">3</b><b style="display:grid;place-items:center;font:800 21px/1 system-ui;color:#151515">5</b>
  </span>
</span>`;

export const gameRegistry=createGameRegistry([
  {
    id:'family-pixel-puzzle',
    title:'لعبة الصور',
    category:'fun',
    playModes:['solo'],
    networkMode:'none',
    learningMode:'none',
    minPlayers:1,
    maxPlayers:1,
    version:1,
    metadata:{accent:'family',icon:familyPuzzleArt(),availabilityLabel:'تحميل مباشر',description:'ركّب صور ياسر وخالد ومشاعل بأسلوب البكسل. اضغط لتحميل نسخة أندرويد مباشرة.'}
  },
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
    id:'domino',
    title:'الدومينو',
    category:'fun',
    playModes:['online'],
    networkMode:'turn-based',
    learningMode:'none',
    minPlayers:2,
    maxPlayers:2,
    version:1,
    load:()=>import('./domino/domino-controller.js'),
    metadata:{accent:'family',icon:dominoArt(),availabilityLabel:'أونلاين — لاعبان',description:'دومينو عائلية بين جهازين. أنشئ غرفة وشارك الرمز مع اللاعب الثاني.'}
  }
]);
