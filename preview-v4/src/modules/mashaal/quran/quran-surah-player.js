import {isItqanEnabledOrigin,loadItqanTrack} from '../../../shared/quran/itqan-catalog-source.js';
import {fetchOfficialAyahPolygons} from '../../../shared/quran/quran-svg-ayah-polygons.js';
import {findOfficialHafsPage,pageIndexInCurriculum} from '../../../shared/quran/quran-svg-page-index.js';
import {loadQuranPractice,markQuranPractice,getQuranPracticeStage,practiceStorageKey} from '../../../shared/quran/quran-practice-progress.js';

const STYLE_KEY='quran-surah-player';

function ensureStyle(){
  if(document.querySelector(`link[data-module-style="${STYLE_KEY}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/modules/mashaal/quran/quran-surah-player.css';
  link.dataset.moduleStyle=STYLE_KEY;
  document.head.appendChild(link);
}

function formatTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '0:00';
  const whole=Math.floor(seconds),minutes=Math.floor(whole/60),secs=String(whole%60).padStart(2,'0');
  return `${minutes}:${secs}`;
}

function normalizedFocusRegion(mushafPage,surahNumber){
  const region=mushafPage?.focusRegion;
  const aspect=Number(mushafPage?.imageAspectRatio);
  const top=Number(region?.top),height=Number(region?.height);
  if(!region||region.surahNumber!==surahNumber)return null;
  if(!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(top)||!Number.isFinite(height))return null;
  if(top<0||height<=0||top+height>1)return null;
  return Object.freeze({top,height,aspect,labelAr:String(region.labelAr||'').trim()});
}

function pageSources(mushafPage){
  const values=[mushafPage?.imagePath,mushafPage?.imageUrl,...(Array.isArray(mushafPage?.fallbackImageUrls)?mushafPage.fallbackImageUrls:[])];
  return [...new Set(values.map(value=>String(value||'').trim()).filter(Boolean))];
}

function normalizedPages(mushafPage,mushafPages){
  const pages=(Array.isArray(mushafPages)?mushafPages:[]).filter(page=>page&&pageSources(page).length);
  if(pages.length)return pages;
  return mushafPage&&pageSources(mushafPage).length?[mushafPage]:[];
}

function mountQuranSurahPlayerCore(host,{
  surahNameAr='السورة',
  surahNumber=null,
  audioPath='',
  mushafPage=null,
  mushafPages=null,
  ayahTimings=null,
  durationSeconds=0,
  autoFollowOfficialPages=false,
  learnerId=null,
  retryPlayText='اضغطي تشغيل مرة ثانية',
  onCompleted=()=>{},
  onPageChange=()=>{}
}={}){
  if(!host)throw new Error('Quran player host is required');
  if(!audioPath)throw new Error('Verified human recitation audio is required');
  ensureStyle();

  const pages=normalizedPages(mushafPage,mushafPages);
  // Optional verse controls. Timing offsets MUST refer to the same audioPath.
  const ayahs=Array.isArray(ayahTimings)?ayahTimings.filter(item=>
    typeof item?.ayahKey==='string'&&Number.isFinite(item?.startMs)&&Number.isFinite(item?.endMs)
    &&item.startMs>=0&&item.endMs>item.startMs
  ):[];

  if(!pages.length)throw new Error('Verified mushaf page image is required');

  host.innerHTML='';
  host.removeAttribute('aria-hidden');
  host.classList.add('quran-player-host');

  const root=document.createElement('section');
  root.className='quran-surah-player';
  root.setAttribute('aria-label',`مشغل سورة ${surahNameAr}`);

  const figure=document.createElement('figure');
  figure.className='quran-page-frame';

  const viewport=document.createElement('div');
  viewport.className='quran-page-viewport';

  const image=document.createElement('img');
  image.className='quran-page-image';
  image.decoding='async';
  image.loading='eager';
  viewport.appendChild(image);
  const overlayPaths=[];
  let verseOverlay=null,overlayEpoch=0;
  const mountOfficialGeometry=geometry=>{
    verseOverlay?.remove();verseOverlay=null;overlayPaths.length=0;
    if(!geometry?.paths?.length)return;
    const ns='http://www.w3.org/2000/svg';
    verseOverlay=document.createElementNS(ns,'svg');
    verseOverlay.classList.add('quran-mushaf-ayah-overlay');
    verseOverlay.setAttribute('viewBox',geometry.viewBox);
    verseOverlay.setAttribute('preserveAspectRatio','xMidYMid meet');
    verseOverlay.setAttribute('aria-label','اضغط الآية لتلاوتها من مصدر إتقان');
    for(const item of geometry.paths){
      const index=ayahs.findIndex(t=>t.ayahKey===item.ayahKey);
      if(index<0)continue;
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',item.d);
      path.classList.add('quran-mushaf-ayah-path');
      path.setAttribute('role','button');
      path.setAttribute('tabindex','0');
      path.setAttribute('aria-label','تشغيل الآية '+String(index+1));
      path.dataset.ayah=item.ayahKey;
      path.addEventListener('click',()=>{void selectAyah(index);});
      path.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();void selectAyah(index);}
      });
      overlayPaths.push(path);
      verseOverlay.appendChild(path);
    }
    if(overlayPaths.length)viewport.appendChild(verseOverlay);
    else verseOverlay=null;
  };

  const caption=document.createElement('figcaption');
  caption.className='quran-page-caption';

  const pageNav=document.createElement('div');
  pageNav.className='quran-page-nav';
  pageNav.setAttribute('role','group');
  pageNav.setAttribute('aria-label','التنقل بين صفحات السورة');
  const previousPage=document.createElement('button');
  previousPage.type='button';previousPage.className='quran-page-nav-button';previousPage.textContent='السابق';
  const pageIndicator=document.createElement('span');
  pageIndicator.className='quran-page-indicator';
  const nextPage=document.createElement('button');
  nextPage.type='button';nextPage.className='quran-page-nav-button';nextPage.textContent='التالي';
  pageNav.append(previousPage,pageIndicator,nextPage);
  if(pages.length<2)pageNav.hidden=true;

  figure.append(viewport,caption,pageNav);

  const audio=new Audio(audioPath);
  audio.preload='metadata';

  const transport=document.createElement('div');
  transport.className='quran-transport';
  transport.setAttribute('role','group');
  transport.setAttribute('aria-label','التحكم في التلاوة');

  const play=document.createElement('button');
  play.type='button';play.className='quran-control quran-control-primary';play.innerHTML='<span aria-hidden="true">▶</span><strong>تشغيل</strong>';
  const pause=document.createElement('button');
  pause.type='button';pause.className='quran-control';pause.innerHTML='<span aria-hidden="true">Ⅱ</span><strong>إيقاف مؤقت</strong>';
  const stop=document.createElement('button');
  stop.type='button';stop.className='quran-control';stop.innerHTML='<span aria-hidden="true">■</span><strong>إيقاف</strong>';
  const restart=document.createElement('button');
  restart.type='button';restart.className='quran-control';restart.innerHTML='<span aria-hidden="true">↺</span><strong>من البداية</strong>';
  transport.append(play,pause,stop,restart);

  const progressWrap=document.createElement('div');
  progressWrap.className='quran-progress-wrap';
  const progress=document.createElement('input');
  progress.type='range';progress.className='quran-progress';progress.min='0';progress.max='1';progress.step='0.1';progress.value='0';progress.disabled=true;
  progress.setAttribute('aria-label','موضع التلاوة');progress.setAttribute('aria-valuetext','0:00');progress.style.setProperty('--seek-percent','0%');
  const time=document.createElement('span');
  time.className='quran-time';time.textContent='0:00 / 0:00';
  progressWrap.append(progress,time);

  const status=document.createElement('p');
  status.className='quran-player-status';status.setAttribute('aria-live','polite');status.textContent='جاهزة للاستماع';

  root.append(figure,transport,progressWrap,status);
  const ayahButtons=[];
  let repeatSelect=null,fromSelect=null,toSelect=null,practiceHint=null,practiceBlindButton=null;
  let practiceBlind=false;
  const canStorePractice=Boolean(practiceStorageKey(learnerId));
  if(ayahs.length){
    root.classList.add('has-ayah-controls');
    const panel=document.createElement('div');panel.className='quran-ayah-controls';
    panel.setAttribute('role','group');panel.setAttribute('aria-label','التدريب على الآيات');
    const heading=document.createElement('div');heading.className='quran-ayah-heading';
    const title=document.createElement('strong');title.textContent='اسمع الآية وكررها';
    const label=document.createElement('label');label.textContent='التكرار ';
    repeatSelect=document.createElement('select');
    repeatSelect.setAttribute('aria-label','عدد تكرارات الآية');
    for(const count of [1,3,5]){
      const option=document.createElement('option');option.value=String(count);option.textContent=count===1?'مرة':count+' مرات';
      if(count===3)option.selected=true;
      repeatSelect.appendChild(option);
    }
    label.appendChild(repeatSelect);heading.append(title,label);
    const buttons=document.createElement('div');buttons.className='quran-ayah-buttons';
    for(let index=0;index<ayahs.length;index++){
      const button=document.createElement('button');button.type='button';
      button.className='quran-ayah-button';button.textContent='الآية '+String(index+1);
      button.setAttribute('aria-pressed','false');button.dataset.ayah=ayahs[index].ayahKey;
      ayahButtons.push(button);buttons.appendChild(button);
    }
    panel.append(heading,buttons);
    const range=document.createElement('div');
    range.className='quran-range-controls';
    const rangeTitle=document.createElement('strong');
    rangeTitle.textContent='كرر مجموعة آيات';
    const fromLabel=document.createElement('label');fromLabel.textContent='من الآية';
    const toLabel=document.createElement('label');toLabel.textContent='إلى الآية';
    fromSelect=document.createElement('select');toSelect=document.createElement('select');
    fromSelect.setAttribute('aria-label','من الآية');toSelect.setAttribute('aria-label','إلى الآية');
    for(let index=0;index<ayahs.length;index++){
      for(const control of [fromSelect,toSelect]){
        const option=document.createElement('option');
        option.value=String(index);option.textContent=String(index+1);control.append(option);
      }
    }
    const lastPractice=canStorePractice?loadQuranPractice(learnerId).last:null;
    const resume=lastPractice?.surahNumber===surahNumber
      ?Math.max(0,ayahs.findIndex(item=>item.ayahKey===surahNumber+':'+lastPractice.ayahNumber)):0;
    fromSelect.value=String(resume);
    toSelect.value=String(Math.min(ayahs.length-1,resume+2));
    fromLabel.append(fromSelect);toLabel.append(toSelect);
    const rangePlay=document.createElement('button');
    rangePlay.type='button';rangePlay.className='quran-range-play';
    rangePlay.textContent='استمع للنطاق وكرره';
    range.append(rangeTitle,fromLabel,toLabel,rangePlay);
    panel.append(range);
    if(canStorePractice){
      const practice=document.createElement('div');
      practice.className='quran-practice-guided';
      const guide=document.createElement('strong');
      guide.textContent=learnerId==='mashaal'?'استمعي ثم رددي':'الحفظ: استمع ← ردّد ← اختبر نفسك';
      const repeatDone=document.createElement('button');
      repeatDone.type='button';repeatDone.className='quran-practice-done';
      repeatDone.textContent=learnerId==='mashaal'?'رددت الآيات':'رددت الآيات بنفسي';
      practiceBlindButton=document.createElement('button');
      practiceBlindButton.type='button';practiceBlindButton.className='quran-practice-blind';
      practiceBlindButton.textContent=learnerId==='mashaal'?'إظهار المصحف':'اختبر نفسي غيب';
      const reviewed=document.createElement('button');
      reviewed.type='button';reviewed.className='quran-practice-reviewed';
      reviewed.textContent='راجعت بنفسي';
      if(learnerId==='mashaal'){reviewed.hidden=true;practiceBlindButton.hidden=true;}
      practiceHint=document.createElement('p');
      practiceHint.className='quran-practice-status';practiceHint.setAttribute('role','status');
      practiceHint.textContent='اختر آياتك، استمع للتلاوة، ثم ردد بنفسك';
      practice.append(guide,repeatDone,practiceBlindButton,reviewed,practiceHint);
      panel.append(practice);
      repeatDone.addEventListener('click',()=>recordPractice('repeated'));
      practiceBlindButton.addEventListener('click',()=>{
        if(learnerId==='mashaal')return;
        practiceBlind=!practiceBlind;
        audio.pause();
        figure.classList.toggle('quran-practice-blind',practiceBlind);
        practiceBlindButton.textContent=practiceBlind?'أظهر المصحف':'اختبر نفسي غيب';
        practiceHint.textContent=practiceBlind?'اختبر حفظك بنفسك، ثم أظهر المصحف للتأكد':'ظهر المصحف للتحقق من إجابتك';
      });
      reviewed.addEventListener('click',()=>{
        if(practiceBlind){practiceHint.textContent='أظهر المصحف أولًا للتحقق من التسميع';return;}
        recordPractice('reviewed');
      });
    }
    rangePlay.addEventListener('click',()=>{void selectRange(Number(fromSelect.value),Number(toSelect.value));});
    root.insertBefore(panel,progressWrap);
  }
  host.appendChild(root);

  let requestedAyahKey='',followTicket=0;
  let selectedAyahIndex=-1,selectedAyahEndIndex=-1,ayahRepeatCount=0;
  let completed=false,destroyed=false,seeking=false,resumeAfterSeek=false,pageIndex=0,sourceIndex=0,touchStartX=0,touchStartY=0,knownDuration=Number.isFinite(Number(durationSeconds))&&Number(durationSeconds)>0?Number(durationSeconds):0;
  const rangeEnd=range=>{
    try{
      const length=Number(range?.length)||0;
      if(!length)return 0;
      const end=Number(range.end(length-1));
      return Number.isFinite(end)&&end>0?end:0;
    }catch{return 0;}
  };
  const finiteDuration=()=>{
    const direct=Number(audio.duration);
    if(Number.isFinite(direct)&&direct>0)knownDuration=Math.max(knownDuration,direct);
    else{
      const seekableEnd=rangeEnd(audio.seekable);
      if(seekableEnd>0)knownDuration=Math.max(knownDuration,seekableEnd);
    }
    return knownDuration;
  };
  const seekValue=()=>{const duration=finiteDuration();if(!duration)return 0;return Math.max(0,Math.min(duration,Number(progress.value)||0));};
  const paintSeek=(value,duration)=>{
    const safeDuration=Number.isFinite(duration)&&duration>0?duration:0;
    const safeValue=safeDuration?Math.max(0,Math.min(safeDuration,Number(value)||0)):0;
    const percent=safeDuration?(safeValue/safeDuration)*100:0;
    progress.style.setProperty('--seek-percent',`${percent}%`);progress.setAttribute('aria-valuetext',formatTime(safeValue));
  };

  const renderPage=()=>{
    const page=pages[pageIndex];
    const focusRegion=ayahs.length?null:normalizedFocusRegion(page,surahNumber);
    const sources=pageSources(page);
    sourceIndex=0;
    overlayEpoch++;
    if(verseOverlay)mountOfficialGeometry(null);
    figure.removeAttribute('data-image-error');
    if(focusRegion){
      figure.dataset.focused='true';viewport.dataset.focused='true';viewport.style.aspectRatio=String(focusRegion.aspect/focusRegion.height);image.style.transform=`translateY(-${focusRegion.top*100}%)`;
    }else{
      figure.removeAttribute('data-focused');viewport.removeAttribute('data-focused');viewport.style.removeProperty('aspect-ratio');image.style.removeProperty('transform');
    }
    image.src=sources[0];
    image.alt=focusRegion?`سورة ${surahNameAr} كما تظهر في صفحة ${page?.pageNumber||''} من مصحف المدينة`:`صفحة ${page?.pageNumber||''} من المصحف التي تحتوي على سورة ${surahNameAr}`;
    const pageLabel=page?.pageNumber?` • صفحة ${page.pageNumber}`:'';
    caption.textContent=focusRegion?`${focusRegion.labelAr||`سورة ${surahNameAr}`} • من مصحف المدينة${pageLabel} • حفص عن عاصم`:`مصحف المدينة • حفص عن عاصم${pageLabel}`;
    pageIndicator.textContent=`صفحة ${pageIndex+1} من ${pages.length}`;
    previousPage.disabled=pageIndex===0;nextPage.disabled=pageIndex===pages.length-1;
    onPageChange({index:pageIndex,count:pages.length,pageNumber:page?.pageNumber||null});
  };
  const changePage=next=>{
    const target=Math.max(0,Math.min(pages.length-1,next));
    if(target===pageIndex)return;
    pageIndex=target;renderPage();
  };

  const followAyahPage=index=>{
    if(!autoFollowOfficialPages||pages.length<2||index<0||destroyed)return;
    const key=ayahs[index]?.ayahKey;
    if(!key||key===requestedAyahKey)return;
    requestedAyahKey=key;
    const ticket=++followTicket;
    // Official Quran SVG JSON is the canonical ayah-to-mushaf-page mapping.
    // No inferred page offsets and no alteration of school progress levels.
    const [sura,verse]=key.split(':').map(Number);
    void findOfficialHafsPage(sura,verse).then(pageNumber=>{
      if(destroyed||ticket!==followTicket||pageNumber==null)return;
      const next=pageIndexInCurriculum(pages,pageNumber);
      if(next>=0&&next!==pageIndex)changePage(next);
    }).catch(()=>{
      // Keep playing even if the Quran SVG CDN is temporarily inaccessible.
    });
  };
  const updateProgress=()=>{
    if(destroyed||seeking)return;
    const duration=finiteDuration(),current=Number(audio.currentTime)||0;
    if(duration){progress.disabled=false;progress.max=String(duration);progress.value=String(Math.min(duration,current));}
    if(!duration)progress.disabled=true;
    paintSeek(current,duration);time.textContent=`${formatTime(current)} / ${duration?formatTime(duration):'--:--'}`;
  };
  const beginSeek=()=>{if(seeking||!finiteDuration())return;seeking=true;resumeAfterSeek=!audio.paused&&!audio.ended;if(resumeAfterSeek)audio.pause();status.textContent='اسحب لاختيار موضع التلاوة';};
  const previewSeek=()=>{const duration=finiteDuration();if(!duration)return;if(!seeking)beginSeek();const target=seekValue();try{audio.currentTime=target;}catch{}paintSeek(target,duration);time.textContent=`${formatTime(target)} / ${formatTime(duration)}`;};
  const paintListeningAyah=()=>{
    const ms=(Number(audio.currentTime)||0)*1000;
    const current=selectedAyahIndex>=0
      ?(ayahs.findIndex((ayah,index)=>index>=selectedAyahIndex
         &&index<=selectedAyahEndIndex&&ms>=ayah.startMs&&ms<ayah.endMs)
         >=0?ayahs.findIndex((ayah,index)=>index>=selectedAyahIndex
           &&index<=selectedAyahEndIndex&&ms>=ayah.startMs&&ms<ayah.endMs):selectedAyahIndex)
      :(audio.paused?-1:ayahs.findIndex((ayah,index)=>ms>=ayah.startMs
         &&(ms<ayah.endMs||(index===ayahs.length-1&&ms<=ayah.endMs))));
    ayahButtons.forEach((button,index)=>{
      const isCurrent=index===current;
      button.classList.toggle('is-current',isCurrent);
      if(isCurrent)button.setAttribute('aria-current','true');
      else button.removeAttribute('aria-current');
    });
    overlayPaths.forEach(path=>{
      const isCurrent=path.dataset.ayah===ayahs[current]?.ayahKey;
      path.classList.toggle('is-current',isCurrent);
      if(isCurrent)path.setAttribute('aria-current','true');
      else path.removeAttribute('aria-current');
    });
    followAyahPage(current);
  };
  const paintAyahSelection=()=>{
    ayahButtons.forEach((button,index)=>{
      const active=index===selectedAyahIndex;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    paintListeningAyah();
  };
  const clearAyahSelection=()=>{
    selectedAyahIndex=-1;selectedAyahEndIndex=-1;ayahRepeatCount=0;paintAyahSelection();
  };
  const rangeSelection=()=>{
    const start=Number(fromSelect?.value),end=Number(toSelect?.value);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>=ayahs.length)return null;
    return {start,end,fromAyah:start+1,toAyah:end+1};
  };
  const recordPractice=stage=>{
    const range=rangeSelection();
    if(!canStorePractice||!range)return false;
    const stored=markQuranPractice(learnerId,{
      surahNumber,fromAyah:range.fromAyah,toAyah:range.toAyah,stage
    });
    if(stored){
      const progress=loadQuranPractice(learnerId).records;
      ayahButtons.forEach((button,index)=>{
        const state=progress[surahNumber+':'+String(index+1)]?.stage||'';
        button.dataset.practiceStage=state;
        button.title=state==='reviewed'?'راجعته غيب':state==='repeated'?'تدربت عليه':state==='listened'?'استمعت إليه':'';
      });
    }
    if(practiceHint){
      practiceHint.textContent=stored
        ?(stage==='listened'?'انتهى الاستماع، الآن ردد بنفسك':stage==='repeated'?'تم تسجيل الترديد الذي أكدته':'تم تسجيل مراجعتك الذاتية، وليست درجة تسميع آلية')
        :'تعذر حفظ التقدم على هذا الجهاز';
    }
    return stored;
  };
  const selectRange=async (start,end)=>{
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>=ayahs.length||destroyed)return;
    if(practiceBlind){
      practiceBlind=false;figure.classList.remove('quran-practice-blind');
      if(practiceBlindButton)practiceBlindButton.textContent='اختبر نفسي غيب';
    }
    audio.pause();selectedAyahIndex=start;selectedAyahEndIndex=end;
    ayahRepeatCount=0;completed=false;seeking=false;
    try{audio.currentTime=ayahs[start].startMs/1000;}
    catch{clearAyahSelection();status.textContent='تعذر بدء النطاق';return;}
    paintAyahSelection();updateProgress();
    status.textContent='الآيات '+String(start+1)+' إلى '+String(end+1)+' — استمع ثم ردد';
    await playAudio();
  };
  const commitSeek=()=>{const duration=finiteDuration();if(!duration)return;const shouldResume=resumeAfterSeek,target=seekValue();clearAyahSelection();try{audio.currentTime=target;}catch{}seeking=false;resumeAfterSeek=false;completed=false;paintSeek(target,duration);updateProgress();if(shouldResume){void playAudio();}else status.textContent='جاهزة من الموضع الجديد';};
  const markCompleted=()=>{completed=true;status.textContent='انتهت التلاوة';updateProgress();onCompleted();};
  const playAudio=async()=>{try{await audio.play();status.textContent=audio.currentTime>0?'نكمل التلاوة':'تعمل التلاوة الآن';paintListeningAyah();return true;}catch{status.textContent=retryPlayText;return false;}};
  const pauseAudio=()=>{audio.pause();paintListeningAyah();status.textContent='متوقفة مؤقتًا';};
  const restartAudio=async()=>{audio.pause();audio.currentTime=selectedAyahIndex>=0?ayahs[selectedAyahIndex].startMs/1000:0;ayahRepeatCount=0;completed=false;seeking=false;resumeAfterSeek=false;updateProgress();return playAudio();};
  const stopAudio=()=>{audio.pause();clearAyahSelection();try{audio.currentTime=0;}catch{}completed=false;seeking=false;resumeAfterSeek=false;updateProgress();paintListeningAyah();status.textContent='متوقفة';};
  const stopOnFamilyNavigation=()=>stopAudio();
  document.addEventListener('family:stop-quran-audio',stopOnFamilyNavigation);
  const showHighlightedVerseOnMushaf=()=>{
    if(!verseOverlay)return;
    const rect=figure.getBoundingClientRect();
    const viewHeight=Number(globalThis.innerHeight)||0;
    if(!viewHeight)return;
    const visible=Math.max(0,Math.min(rect.bottom,viewHeight)-Math.max(rect.top,0));
    // The verse buttons are below the large page on a phone. Without this,
    // users can hear the ayah but cannot see its highlight above the fold.
    if(visible<Math.min(260,rect.height/2)){
      figure.scrollIntoView({
        behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',
        block:'center'
      });
    }
  };
  const selectAyah=async (index,{revealInMushaf=false}={})=>{
    if(!ayahs[index]||destroyed)return;
    if(fromSelect)fromSelect.value=String(index);
    if(toSelect)toSelect.value=String(index);
    await selectRange(index,index);
    if(revealInMushaf)showHighlightedVerseOnMushaf();
  };
  const handleAyahBoundary=()=>{
    if(selectedAyahIndex<0||destroyed||seeking)return false;
    const item=ayahs[selectedAyahEndIndex>=selectedAyahIndex?selectedAyahEndIndex:selectedAyahIndex];
    if(!item||audio.currentTime*1000<item.endMs-50)return false;
    ayahRepeatCount++;
    const target=Number(repeatSelect?.value)||1;
    if(ayahRepeatCount<target){
      try{audio.currentTime=item.startMs/1000;}catch{clearAyahSelection();audio.pause();return true;}
      status.textContent='إعادة الآية '+String(selectedAyahIndex+1)+' — '+String(ayahRepeatCount+1)+' من '+String(target);
      if(audio.paused)void playAudio();
    }else{
      const start=selectedAyahIndex+1,end=selectedAyahEndIndex+1;
      audio.pause();
      if(fromSelect&&toSelect){fromSelect.value=String(start-1);toSelect.value=String(end-1);recordPractice('listened');}
      clearAyahSelection();
      status.textContent=start===end?'اكتمل تكرار الآية '+start:'اكتمل تكرار الآيات '+start+' إلى '+end;
    }
    updateProgress();return true;
  };

  ayahButtons.forEach((button,index)=>button.addEventListener('click',()=>{void selectAyah(index,{revealInMushaf:true});}));
  play.addEventListener('click',()=>{void playAudio();});pause.addEventListener('click',pauseAudio);stop.addEventListener('click',stopAudio);restart.addEventListener('click',()=>{void restartAudio();});
  previousPage.addEventListener('click',()=>changePage(pageIndex-1));nextPage.addEventListener('click',()=>changePage(pageIndex+1));
  viewport.addEventListener('touchstart',event=>{const touch=event.changedTouches?.[0];if(!touch)return;touchStartX=touch.clientX;touchStartY=touch.clientY;},{passive:true});
  viewport.addEventListener('touchend',event=>{const touch=event.changedTouches?.[0];if(!touch)return;const dx=touch.clientX-touchStartX,dy=touch.clientY-touchStartY;if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy)*1.2)return;if(dx<0)changePage(pageIndex+1);else changePage(pageIndex-1);},{passive:true});
  progress.addEventListener('pointerdown',beginSeek);progress.addEventListener('input',previewSeek);progress.addEventListener('change',commitSeek);progress.addEventListener('pointerup',commitSeek);progress.addEventListener('pointercancel',commitSeek);
  audio.addEventListener('timeupdate',()=>{updateProgress();handleAyahBoundary();paintListeningAyah();});
  audio.addEventListener('loadedmetadata',updateProgress);
  audio.addEventListener('durationchange',updateProgress);
  audio.addEventListener('progress',updateProgress);
  audio.addEventListener('canplay',updateProgress);
  audio.addEventListener('ended',()=>{if(!handleAyahBoundary())markCompleted();});
  audio.addEventListener('error',()=>{status.textContent='تعذر تحميل التلاوة';});
  image.addEventListener('load',()=>{
    figure.removeAttribute('data-image-error');
    if(!ayahs.length||!Number.isInteger(surahNumber))return;
    const thisEpoch=++overlayEpoch,src=image.currentSrc||image.src;
    void fetchOfficialAyahPolygons(src,surahNumber).then(geometry=>{
      if(destroyed||thisEpoch!==overlayEpoch)return;
      mountOfficialGeometry(geometry);
      paintListeningAyah();
    }).catch(()=>{
      if(!destroyed&&thisEpoch===overlayEpoch)mountOfficialGeometry(null);
    });
  });
  image.addEventListener('error',()=>{overlayEpoch++;if(verseOverlay)verseOverlay.style.display='none';const page=pages[pageIndex],sources=pageSources(page);sourceIndex+=1;if(sourceIndex<sources.length){image.src=sources[sourceIndex];return;}figure.dataset.imageError='true';caption.textContent='تعذر تحميل صفحة المصحف — لا يتم استبدالها بنص مولّد';});

  renderPage();

  return Object.freeze({
    play:playAudio,pause:pauseAudio,restart:restartAudio,stop:stopAudio,
    nextPage(){changePage(pageIndex+1);},previousPage(){changePage(pageIndex-1);},getPageIndex(){return pageIndex;},
    hasCompleted(){return completed;},
    destroy(){destroyed=true;overlayEpoch++;followTicket++;document.removeEventListener('family:stop-quran-audio',stopOnFamilyNavigation);stopAudio();audio.src='';host.classList.remove('quran-player-host');host.innerHTML='';}
  });
}


/**
 * Stable player facade for Yasser, Khaled and Mashaal.
 * The original reciter and learner progress remain untouched. Only on the
 * isolated pilot can the listener opt into an Itqan CMS recording WITH its
 * own embedded timestamps, and return to the original at any time.
 */
export function mountQuranSurahPlayer(host,options={}){
  let instance=mountQuranSurahPlayerCore(host,options);
  let disposed=false,activeItqan=false,source=null,sourceTicket=0;
  const attachToggle=()=>{
    if(disposed||!source)return;
    const root=host.querySelector('.quran-surah-player');
    if(!root)return;
    const panel=document.createElement('div');
    panel.className='quran-itqan-source-panel';
    const label=document.createElement('p');
    label.className='quran-itqan-source-name';
    label.textContent=activeItqan
      ?'تلاوة إتقان المتزامنة • '+source.reciter+' • '+source.riwayah
      :'تلاوة أصلية • يمكنك تجربة تلاوة إتقان بصوت '+source.reciter+' مع توقيت آياتها';
    const button=document.createElement('button');
    button.type='button';
    button.className='quran-itqan-toggle';
    button.textContent=activeItqan?'الرجوع إلى التلاوة الأصلية':'استمع بتلاوة إتقان وتوقيت آياتها';
    button.addEventListener('click',()=>{
      if(disposed)return;
      const previouslyAt=instance.getPageIndex();
      instance.destroy();
      activeItqan=!activeItqan;
      instance=mountQuranSurahPlayerCore(host,activeItqan?{
        ...options,
        audioPath:source.audioPath,
        ayahTimings:source.ayahTimings,
        durationSeconds:source.durationSeconds,
        autoFollowOfficialPages:true
      }:options);
      for(let i=0;i<previouslyAt;i++)instance.nextPage();
      attachToggle();
    });
    panel.append(label,button);
    root.insertBefore(panel,root.querySelector('.quran-transport'));
    // Keep the source choice visible before the transport buttons on phones.
  };
  if(isItqanEnabledOrigin()){
    const ticket=++sourceTicket;
    void loadItqanTrack(options.surahNumber).then(track=>{
      if(disposed||ticket!==sourceTicket||!track)return;
      source=track;attachToggle();
    }).catch(()=>{});
  }
  return Object.freeze({
    play:(...args)=>instance.play(...args),
    pause:(...args)=>instance.pause(...args),
    stop:(...args)=>instance.stop(...args),
    restart:(...args)=>instance.restart(...args),
    nextPage:(...args)=>instance.nextPage(...args),
    previousPage:(...args)=>instance.previousPage(...args),
    getPageIndex:()=>instance.getPageIndex(),
    hasCompleted:()=>instance.hasCompleted(),
    destroy(){
      if(disposed)return;
      disposed=true;sourceTicket++;
      instance.destroy();
    }
  });
}
