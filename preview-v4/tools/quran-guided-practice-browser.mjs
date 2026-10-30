import {chromium,webkit} from 'playwright';
// Local ephemeral test origin; this script does not touch real learner storage.
const base='http://127.0.0.1:8790/';
for(const [browserName,browserType] of [['chrome',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({
    headless:true,
    ...(browserName==='chrome'?{
      executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']
    }:{})
  });
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const browserErrors=[];
    page.on('pageerror',error=>browserErrors.push(error.message));
    await page.goto(base+'?itqanPilot=1',{waitUntil:'domcontentloaded'});
    // Fake only the audio clock, not the player, CMS catalog or markup. This
    // permits deterministic playback-completion tests in Chrome and Safari.
    await page.evaluate(()=>{
      window.__qaAudio=[];
      window.Audio=class MockAudio extends EventTarget{
        constructor(src){
          super();this.src=src;this.currentTime=0;this.duration=4000;
          this.paused=true;this.ended=false;
          this.seekable={length:1,end(){return 4000;}};
          window.__qaAudio.push(this);
        }
        play(){this.paused=false;return Promise.resolve();}
        pause(){this.paused=true;}
      };
    });
    for(const learner of ['khaled','yasser','mashaal']){
      const config=await page.evaluate(async who=>{
        const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
        let item,options;
        if(who==='khaled'){
          const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
          item=KHALED_QURAN_TERMS[2].find(x=>x.surahNumber===93);
          options={audioPath:item.audioPath,mushafPage:item.mushafPage};
        }else if(who==='yasser'){
          const {YASSER_QURAN_TERMS}=await import('./src/modules/yasser/quran/yasser-quran.js');
          item=YASSER_QURAN_TERMS[1].recitation.find(x=>x.surahNumber===38);
          options={audioPath:item.audioPath,mushafPage:item.mushafPage,mushafPages:item.mushafPages};
        }else{
          const {getMashaalRecitationAsset}=await import('./src/modules/mashaal/curriculum/recitation-media-manifest.js');
          item=getMashaalRecitationAsset('kfgqpc-ibrahim-al-akhdar-hafs-114');
          options={audioPath:item.localPath,mushafPage:item.mushafPage};
        }
        if(!item)throw Error('Missing curriculum item for '+who);
        document.body.replaceChildren();
        const host=document.createElement('div');document.body.append(host);
        window.__qaPlayer?.destroy?.();
        window.__qaPlayer=mountQuranSurahPlayer(host,{
          ...options,learnerId:who,surahNameAr:item.surahNameAr,surahNumber:item.surahNumber
        });
        return{surahNumber:item.surahNumber};
      },learner);
      await page.locator('.quran-itqan-toggle').waitFor({timeout:20000});
      await page.locator('.quran-itqan-toggle').click();
      await page.locator('.quran-range-controls').waitFor({timeout:12000});
      console.log('SELECT_OPTIONS',browserName,learner,JSON.stringify(await page.locator('.quran-range-controls select').evaluateAll(els=>els.map(e=>({
        html:e.outerHTML.slice(0,900),
        options:[...e.options].slice(0,6).map(o=>({value:o.value,text:o.text,selected:o.selected}))
      })))));
      console.log('SELECT_OPTIONS_DIAGNOSTIC',browserName,learner,
        JSON.stringify(await page.locator('.quran-range-controls select').evaluateAll(els=>els.map(e=>({
          options:[...e.options].slice(0,7).map(o=>({text:o.textContent,value:o.value,selected:o.selected})),
          html:e.outerHTML.slice(0,550),name:e.getAttribute('aria-label')
        })))));
      const firstSelected=await page.locator('.quran-range-controls select').nth(0).selectOption({value:'1'});
      console.log('SET_FROM',browserName,learner,JSON.stringify(firstSelected),
        JSON.stringify(await page.locator('.quran-range-controls select').evaluateAll(els=>els.map(e=>e.value))));
      const secondSelected=await page.locator('.quran-range-controls select').nth(1).selectOption({value:'3'});
      console.log('SET_TO',browserName,learner,JSON.stringify(secondSelected),
        JSON.stringify(await page.locator('.quran-range-controls select').evaluateAll(els=>els.map(e=>e.value))));
      console.log('RANGE_BEFORE_CLICK',browserName,learner,JSON.stringify(await page.evaluate(()=>({
        selects:[...document.querySelectorAll('.quran-range-controls select')].map(x=>x.value),
        audioCount:window.__qaAudio.length,
        source:document.querySelector('.quran-itqan-source-name')?.textContent
      }))));
      const data=await page.evaluate(async n=>{
        const catalog=await fetch('./assets/recitation/itqan-hafs-tracks.json').then(r=>r.json());
        const timings=catalog.tracks[String(n)]?.ayahTimings;
        if(!timings||timings.length<4)throw Error('No genuine Itqan track for '+n);
        return {start:timings[1].startMs/1000,end:timings[3].endMs/1000};
      },config.surahNumber);
      await page.locator('.quran-range-play').click();
      const initial=await page.evaluate(()=>({
        selects:[...document.querySelectorAll('.quran-range-controls select')].map(x=>x.value),
        audioCount:window.__qaAudio.length,
        audioStart:window.__qaAudio.at(-1).currentTime,
        status:document.querySelector('.quran-player-status')?.textContent,
        repeat:document.querySelector('[aria-label="عدد تكرارات الآية"]')?.value
      }));
      console.log('RANGE_START_DEBUG',browserName,learner,JSON.stringify(initial),JSON.stringify(data));
      for(let cycle=1;cycle<=3;cycle++){
        const state=await page.evaluate(({end,start})=>{
          const audio=window.__qaAudio.at(-1);
          audio.currentTime=end+0.08;
          audio.dispatchEvent(new Event('timeupdate'));
          return {paused:audio.paused,time:audio.currentTime,
            status:document.querySelector('.quran-player-status')?.textContent};
        },data);
        if(cycle<3){
          if(Math.abs(state.time-data.start)>0.1||state.paused)
            throw Error(browserName+' '+learner+' did not repeat full range at cycle '+cycle+' '+JSON.stringify(state));
        }else if(!state.paused||!state.status.includes('اكتمل تكرار الآيات')){
          throw Error(browserName+' '+learner+' did not finish 3 full repetitions '+JSON.stringify(state));
        }
      }
      const verify=async stage=>page.evaluate(({who,number,wanted})=>{
        const key='family-learning:quran-practice:v1:'+who;
        const state=JSON.parse(localStorage.getItem(key));
        if(!state||state.version!==1)throw Error('practice not persisted');
        for(let ayah=2;ayah<=4;ayah++){
          if(state.records[number+':'+ayah]?.stage!==wanted)
            throw Error('Missing practice status for verse '+ayah+' '+JSON.stringify(state.records[number+':'+ayah]));
        }
        return state.last;
      },{who:learner,number:config.surahNumber,wanted:stage});
      await verify('listened');
      await page.locator('.quran-practice-done').click();
      await verify('repeated');
      if(learner!=='mashaal'){
        await page.locator('.quran-practice-blind').click();
        const hidden=await page.locator('.quran-page-frame').evaluate(el=>el.classList.contains('quran-practice-blind'));
        if(!hidden)throw Error('self-review blind mode unavailable');
        await page.locator('.quran-practice-blind').click();
        await page.locator('.quran-practice-reviewed').click();
        await verify('reviewed');
      }else if(!await page.locator('.quran-practice-reviewed').isHidden()){
        throw Error('KG3 unexpectedly received exam scoring');
      }
      const stored=await page.evaluate(who=>Object.keys(localStorage)
        .filter(key=>key.startsWith('family-learning:quran-practice:v1:')&&key.endsWith(who)),learner);
      if(stored.length!==1)throw Error('Per learner namespace incorrect '+learner);
      console.log('GUIDED_QURAN_RANGE_PASS',browserName,learner,
        'surah',config.surahNumber,'range',2,'to',4,'repeats',3);
    }
    if(browserErrors.length)throw Error(browserName+' page errors: '+browserErrors.slice(0,4).join('; '));
    console.log('GUIDED_QURAN_BROWSER_PASS',browserName);
  }finally{await browser.close();}
}
