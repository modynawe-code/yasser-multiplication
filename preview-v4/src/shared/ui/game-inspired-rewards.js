import { REWARD_CATALOG } from '../rewards/reward-catalog.js';

const freezeItem=item=>Object.freeze({...item,rewardIds:Object.freeze([...(item.rewardIds||[item.rewardId])])});
const personal=(id,rewardIds,label,graphicKey,kind,hint,tier='rare')=>freezeItem({id,rewardIds,label,graphicKey,kind,hint,tier,category:'personal',unlockCount:1});
const chest=(id,label,graphicKey,unlockCount,tier,hint)=>freezeItem({id,rewardIds:['surprise-box'],label,graphicKey,kind:'chest',hint,tier,category:'shared',unlockCount});

const SHARED_CHESTS=Object.freeze([
  chest('shared-common-chest','الصندوق العادي','shared-common-chest',1,'common','يُفتح عند أول محطة أسئلة كبيرة.'),
  chest('shared-silver-chest','الصندوق الفضي','shared-silver-chest',2,'rare','يُفتح عند مواصلة التدريب والوصول للمحطة الثانية.'),
  chest('shared-gold-chest','الصندوق الذهبي','shared-gold-chest',3,'legendary','يُفتح بعد إنجاز تدريبي كبير ومستمر.')
]);

const KHALED=Object.freeze([
  personal('khaled-rocket-car',['mastery-cup'],'سيارة صاروخية','khaled-rocket-car','car','أتقن عدة مهارات لتفتح السيارة الصاروخية.','epic'),
  personal('khaled-energy-ball',['accuracy-medal'],'صندوق الجواهر','khaled-energy-ball','chest','حافظ على دقة عالية خلال الأسبوع لتفتح صندوق الجواهر.','rare'),
  personal('khaled-crystal-sword',['mastery-shield'],'ميدالية السرعة','khaled-crystal-sword','wheel','أتقن مهارة جديدة لتفتح ميدالية السرعة.','rare'),
  personal('khaled-neon-wheels',['streak-flame'],'كأس الفوز','khaled-neon-wheels','trophy','استمر عدة أيام متتالية لتفتح كأس الفوز.','epic'),
  personal('khaled-power-cube',['progress-badge'],'صندوق المفاجآت','khaled-power-cube','chest','تقدّم في مستواك أو أكمل 3 جولات ألعاب لفتح صندوق المفاجآت.','common'),
  personal('khaled-hero-cup',['weekly-cup','distinction-crown'],'مُعزِّز الطاقة','khaled-hero-cup','boost','أنجز تحديًا أسبوعيًا قويًا أو وصل لمستوى متقدم لتفتح مُعزِّز الطاقة.','legendary'),
  ...SHARED_CHESTS
]);

const YASSER=Object.freeze([
  personal('yasser-elite-racer',['mastery-cup'],'بطل السباقات','yasser-elite-racer','car','أتقن عدة مهارات لتفتح جائزة بطل السباقات.','epic'),
  personal('yasser-champion-ball',['accuracy-medal'],'سيف الكريستال','yasser-champion-ball','sword','حافظ على دقة عالية خلال الأسبوع لتفتح سيف الكريستال.','rare'),
  personal('yasser-pro-shield',['mastery-shield'],'شارة الإتقان','yasser-pro-shield','shield','أتقن مهارة جديدة لتفتح شارة الإتقان.','rare'),
  personal('yasser-inferno-boost',['streak-flame'],'الصندوق الأسطوري','yasser-inferno-boost','chest','حافظ على سلسلة تعلم مستمرة لتفتح الصندوق الأسطوري.','epic'),
  personal('yasser-challenger-badge',['progress-badge'],'ميدالية البطولة','yasser-challenger-badge','wheel','حسّن مستواك أو أكمل 3 جولات ألعاب لتفتح ميدالية البطولة.','common'),
  personal('yasser-legend-cup',['weekly-cup','distinction-crown'],'كأس الفائز الكبير','yasser-legend-cup','trophy','أنجز تحديًا أسبوعيًا قويًا أو وصل لمستوى خبير لتفتح كأس الفائز الكبير.','legendary'),
  ...SHARED_CHESTS
]);

export const GAME_REWARD_PRESENTATIONS=Object.freeze({khaled:KHALED,yasser:YASSER});

function genericCatalog(){
  return REWARD_CATALOG.map(item=>freezeItem({...item,rewardIds:[item.id],kind:'legacy',hint:'واصل التعلم لفتح هذه الجائزة.',tier:item.importance==='major'?'epic':'rare',category:'personal',unlockCount:1}));
}
export function rewardPresentationCatalog(learnerId){
  return GAME_REWARD_PRESENTATIONS[String(learnerId||'').trim().toLowerCase()]||genericCatalog();
}
export function rewardPresentationCount(item,summary){
  return (item?.rewardIds||[]).reduce((total,id)=>total+Math.max(0,Number(summary?.counts?.[id])||0),0);
}
export function rewardPresentationUnlocked(item,summary){return rewardPresentationCount(item,summary)>=Math.max(1,Number(item?.unlockCount)||1);}
export function rewardPresentationUnlock(item,summary){
  const ids=new Set(item?.rewardIds||[]),records=(Array.isArray(summary?.unlocks)?summary.unlocks:[]).filter(entry=>ids.has(entry?.rewardId)).sort((a,b)=>new Date(a?.at||0)-new Date(b?.at||0));
  const threshold=Math.max(1,Number(item?.unlockCount)||1);return records[threshold-1]||null;
}
export function latestRewardPresentation(learnerId,summary){
  const catalog=rewardPresentationCatalog(learnerId);let best=null;
  for(const item of catalog){
    const unlock=rewardPresentationUnlock(item,summary);if(!unlock)continue;
    const at=Number(new Date(unlock.at||0))||0;
    if(!best||at>best.at||(at===best.at&&(item.unlockCount||1)>(best.item.unlockCount||1)))best={item,at};
  }
  return best?.item||catalog[0];
}

const VISUALS=Object.freeze({
  'khaled-rocket-car':{kind:'car',a:'#19c9ff',b:'#0757c9',accent:'#e9fbff'},
  'khaled-energy-ball':{kind:'chest',a:'#20d7ff',b:'#0557cb',accent:'#a6f4ff'},
  'khaled-crystal-sword':{kind:'wheel',a:'#50efff',b:'#0877de',accent:'#ecffff'},
  'khaled-neon-wheels':{kind:'trophy',a:'#28dcff',b:'#183fd2',accent:'#a6fbff'},
  'khaled-power-cube':{kind:'chest',a:'#25e1ff',b:'#096bd0',accent:'#dffcff'},
  'khaled-hero-cup':{kind:'boost',a:'#ffd64a',b:'#f28300',accent:'#fff5ab'},
  'yasser-elite-racer':{kind:'car',a:'#ff4c36',b:'#7c0717',accent:'#ffd86a'},
  'yasser-champion-ball':{kind:'sword',a:'#ffb62c',b:'#b31319',accent:'#fff0a0'},
  'yasser-pro-shield':{kind:'shield',a:'#ffcb45',b:'#7a0a1b',accent:'#fff4b2'},
  'yasser-inferno-boost':{kind:'chest',a:'#ffb21f',b:'#d51618',accent:'#ffe381'},
  'yasser-challenger-badge':{kind:'wheel',a:'#ffcf42',b:'#8a1020',accent:'#fff0a7'},
  'yasser-legend-cup':{kind:'trophy',a:'#ffd64a',b:'#b61718',accent:'#fff7bd'},
  'shared-common-chest':{kind:'chest',a:'#d78a31',b:'#633414',accent:'#ffd266'},
  'shared-silver-chest':{kind:'chest',a:'#d9f1ff',b:'#52758f',accent:'#6be8ff'},
  'shared-gold-chest':{kind:'chest',a:'#ffe05b',b:'#b76a00',accent:'#fff5a8'}
});

function iconMarkup(kind){
  if(kind==='car')return '<g transform="translate(18 41)"><path d="M16 28h72l-8-20H41L28 17H16z" fill="url(#g)"/><path d="M41 8h26l10 20H29z" fill="rgba(255,255,255,.25)"/><rect x="10" y="26" width="84" height="23" rx="10" fill="url(#g)"/><circle cx="29" cy="51" r="11" fill="#081325" stroke="var(--accent)" stroke-width="5"/><circle cx="76" cy="51" r="11" fill="#081325" stroke="var(--accent)" stroke-width="5"/><path d="M87 9h13v7H85z" fill="var(--accent)"/></g>';
  if(kind==='ball')return '<g transform="translate(32 25)"><circle cx="32" cy="32" r="31" fill="url(#g)" stroke="var(--accent)" stroke-width="4"/><path d="M32 13 45 23 40 39 24 39 19 23z" fill="rgba(0,0,20,.42)"/><path d="m19 23-15 2m41-2 15 2M24 39l-8 17m24-17 8 17" stroke="rgba(255,255,255,.55)" stroke-width="4"/></g>';
  if(kind==='sword')return '<g transform="translate(33 18) rotate(42 32 46)"><path d="M27 0h12l4 56-10 13-10-13z" fill="url(#g)" stroke="var(--accent)" stroke-width="3"/><path d="M13 58h44v10H13z" rx="4" fill="var(--accent)"/><path d="M29 66h12v31H29z" fill="#6b391c"/><path d="M24 94h22v8H24z" rx="4" fill="var(--accent)"/></g>';
  if(kind==='wheel')return '<g transform="translate(29 23)"><circle cx="35" cy="35" r="34" fill="#071627" stroke="url(#g)" stroke-width="10"/><circle cx="35" cy="35" r="18" fill="none" stroke="var(--accent)" stroke-width="5"/><circle cx="35" cy="35" r="6" fill="var(--accent)"/><path d="M35 17v36M17 35h36M22 22l26 26M48 22 22 48" stroke="url(#g)" stroke-width="5"/></g>';
  if(kind==='cube')return '<g transform="translate(30 24)"><path d="m35 0 34 17-34 18L1 17z" fill="var(--accent)"/><path d="M1 17 35 35v38L1 55z" fill="url(#g)"/><path d="m69 17-34 18v38l34-18z" fill="rgba(0,35,100,.55)"/><path d="M35 35v38M1 17l34 18 34-18" stroke="rgba(255,255,255,.5)" stroke-width="3"/></g>';
  if(kind==='shield')return '<g transform="translate(31 17)"><path d="M35 2 67 14v29c0 22-14 39-32 48C17 82 3 65 3 43V14z" fill="url(#g)" stroke="var(--accent)" stroke-width="4"/><path d="m35 23 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="var(--accent)"/></g>';
  if(kind==='boost')return '<g transform="translate(27 18)"><path d="M43 0c8 24-16 28-2 47 3-18 20-24 18-40 17 15 26 36 17 57-10 24-42 34-62 16C-6 62 4 32 24 20c-3 15 2 23 9 27-1-17 7-29 10-47z" fill="url(#g)" stroke="var(--accent)" stroke-width="3"/><path d="M43 42c6 12-7 16-2 28 2-7 9-11 10-19 7 9 8 22 0 29-8 8-23 5-27-6-4-10 3-22 12-27-2 8 1 13 7 16-2-8-1-14 0-21z" fill="var(--accent)"/></g>';
  if(kind==='badge')return '<g transform="translate(28 20)"><path d="m36 0 14 12 18 1 4 18 12 14-12 14-4 18-18 1-14 12-14-12-18-1-4-18L0 45l12-14 4-18 18-1z" fill="url(#g)" stroke="var(--accent)" stroke-width="4"/><path d="m36 22 7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" fill="var(--accent)"/></g>';
  if(kind==='trophy')return '<g transform="translate(28 17)"><path d="M18 5h39v25c0 20-8 31-20 35-12-4-19-15-19-35z" fill="url(#g)" stroke="var(--accent)" stroke-width="3"/><path d="M18 15H5v12c0 14 9 21 20 22M57 15h13v12c0 14-9 21-20 22" fill="none" stroke="var(--accent)" stroke-width="7"/><path d="M33 64h9v14h18v10H15V78h18z" fill="var(--accent)"/><path d="m37 17 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="var(--accent)"/></g>';
  if(kind==='chest')return '<g transform="translate(20 27)"><path d="M8 24V10C8 3 13 0 20 0h64c7 0 12 3 12 10v14z" fill="url(#g)" stroke="var(--accent)" stroke-width="4"/><rect x="4" y="23" width="96" height="57" rx="8" fill="url(#g)" stroke="var(--accent)" stroke-width="4"/><path d="M52 24v56M4 42h96" stroke="rgba(255,255,255,.42)" stroke-width="4"/><rect x="43" y="34" width="18" height="24" rx="4" fill="var(--accent)"/><circle cx="52" cy="44" r="4" fill="#4b2b0a"/></g>';
  return '';
}

export function rewardIllustrationSource(graphicKey){
  const cfg=VISUALS[String(graphicKey||'')];if(!cfg)return null;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style="--accent:${cfg.accent}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${cfg.a}"/><stop offset="1" stop-color="${cfg.b}"/></linearGradient><filter id="s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#00152e" flood-opacity=".45"/></filter></defs><circle cx="64" cy="64" r="55" fill="${cfg.a}" opacity=".09"/><g filter="url(#s)">${iconMarkup(cfg.kind)}</g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
