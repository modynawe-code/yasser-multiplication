import { mountQuranSurahPlayer } from '../../mashaal/quran/quran-surah-player.js';

const QURAN_SVG_COMMIT='b91d39e1065b57bdda3e94aca8ecf3575e50e1e6';
const AUDIO_BASE='https://cdn.quran.ws/KFGQPC/resources/quran-audios/akhdar-sura/sura';
const SVG_BASE=`https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;
const RAW_SVG_BASE=`https://raw.githubusercontent.com/quranpedia/quran-svg/${QURAN_SVG_COMMIT}/mushafs/hafs/kfqc/svg`;

const TERM_1=Object.freeze([
  [1,'الفاتحة',1],[114,'الناس',604],[113,'الفلق',604],[112,'الإخلاص',604],[111,'المسد',603],
  [110,'النصر',603],[109,'الكافرون',603],[108,'الكوثر',602],[107,'الماعون',602],[106,'قريش',602],
  [105,'الفيل',601],[104,'الهمزة',601],[103,'العصر',601],[102,'التكاثر',600],[101,'القارعة',600]
]);
const TERM_2=Object.freeze([
  [100,'العاديات',599],[99,'الزلزلة',599],[98,'البينة',598],[97,'القدر',598],
  [96,'العلق',597],[95,'التين',597],[94,'الشرح',596],[93,'الضحى',596]
]);

function mediaFor([surahNumber,surahNameAr,pageNumber]){
  const code=String(surahNumber).padStart(3,'0');
  const local604=pageNumber===604?'./assets/recitation/kfqc-hafs-page-604.svg':'';
  return Object.freeze({
    surahNumber,surahNameAr,pageNumber,
    audioPath:`${AUDIO_BASE}/10-${code}D00-A02.mp3`,
    mushafPage:Object.freeze({
      sourceId:'kfgqpc-hafs-madinah-svg',publisherAr:'مجمع الملك فهد لطباعة المصحف الشريف',
      riwayahAr:'حفص عن عاصم',pageNumber,imagePath:local604,
      imageUrl:`${SVG_BASE}/${pageNumber}.svg`,fallbackImageUrls:Object.freeze([`${RAW_SVG_BASE}/${pageNumber}.svg`]),
      distributionCommit:QURAN_SVG_COMMIT,imageAspectRatio:.6272727273,offlineBundled:Boolean(local604)
    })
  });
}

export const KHALED_QURAN_TERMS=Object.freeze({
  1:Object.freeze(TERM_1.map(mediaFor)),
  2:Object.freeze(TERM_2.map(mediaFor))
});

function ensureStyle(){
  if(document.querySelector('link[data-module-style="khaled-quran"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='src/modules/khaled/quran/khaled-quran.css';link.dataset.moduleStyle='khaled-quran';document.head.appendChild(link);
}

export function createKhaledQuranController({showView,onBack}={}){
  let term=1,player=null,bound=false,selectedSurah=null;
  const byId=id=>document.getElementById(id);
  const destroyPlayer=()=>{if(!player)return;try{player.destroy();}catch{}player=null;};
  function renderTerms(){
    document.querySelectorAll('[data-khaled-quran-term]').forEach(button=>{
      const active=Number(button.dataset.khaledQuranTerm)===term;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderSurahs(){
    const host=byId('khaledQuranSurahs');if(!host)return;host.innerHTML='';
    for(const item of KHALED_QURAN_TERMS[term]){
      const button=document.createElement('button');button.type='button';button.className='khaled-quran-surah';
      button.dataset.surah=String(item.surahNumber);button.innerHTML=`<span class="khaled-quran-number">${item.surahNumber}</span><strong>سورة ${item.surahNameAr}</strong><small>صفحة ${item.pageNumber}</small>`;
      button.setAttribute('aria-label',`سورة ${item.surahNameAr}`);button.addEventListener('click',()=>openSurah(item,button));host.appendChild(button);
    }
  }
  function openSurah(item,button){
    destroyPlayer();selectedSurah=item.surahNumber;
    document.querySelectorAll('.khaled-quran-surah').forEach(node=>node.classList.toggle('selected',node===button));
    const title=byId('khaledQuranSelectedTitle');if(title)title.textContent=`سورة ${item.surahNameAr}`;
    const host=byId('khaledQuranPlayer');if(!host)return;
    host.hidden=false;
    player=mountQuranSurahPlayer(host,{surahNameAr:item.surahNameAr,surahNumber:item.surahNumber,audioPath:item.audioPath,mushafPage:item.mushafPage,retryPlayText:'اضغط تشغيل مرة ثانية'});
    host.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function setTerm(next){
    const value=Number(next);if(!KHALED_QURAN_TERMS[value]||value===term)return;
    term=value;selectedSurah=null;destroyPlayer();const host=byId('khaledQuranPlayer');if(host){host.hidden=true;host.innerHTML='';}
    const title=byId('khaledQuranSelectedTitle');if(title)title.textContent='اختر سورة';renderTerms();renderSurahs();
  }
  function bind(){
    if(bound)return;bound=true;ensureStyle();
    document.querySelectorAll('[data-khaled-quran-term]').forEach(button=>button.addEventListener('click',()=>setTerm(button.dataset.khaledQuranTerm)));
    byId('khaledQuranBack')?.addEventListener('click',()=>{destroyPlayer();onBack?.();});
  }
  return Object.freeze({
    open(){bind();renderTerms();renderSurahs();showView?.('khaledQuranView');},
    leave(){destroyPlayer();},
    getSelectedSurah(){return selectedSurah;}
  });
}
