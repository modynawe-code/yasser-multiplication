// Browser acceptance of the same deployed shared Quran player and source build.
// Runs on Chromium AND WebKit (Safari engine). No child's saved progress is used.
import {chromium,webkit} from 'playwright';
const origin='http://127.0.0.1:8790/?itqanPilot=1';
for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true,...(name==='chromium'?{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    for(const learner of ['khaled','mashaal','yasser']){
      await page.evaluate(async learner=>{
        window.__quranTestPlayer?.destroy?.();
        const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
        let item,options;
        if(learner==='khaled'){
          const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
          item=KHALED_QURAN_TERMS[2].find(s=>s.surahNumber===93);
          options={audioPath:item.audioPath,mushafPage:item.mushafPage};
        }else if(learner==='yasser'){
          const {YASSER_QURAN_TERMS}=await import('./src/modules/yasser/quran/yasser-quran.js');
          item=YASSER_QURAN_TERMS[1].recitation.find(s=>s.surahNumber===38);
          options={audioPath:item.audioPath,mushafPage:item.mushafPage,mushafPages:item.mushafPages,durationSeconds:item.durationSeconds};
        }else{
          const {getMashaalRecitationAsset}=await import('./src/modules/mashaal/curriculum/recitation-media-manifest.js');
          item=getMashaalRecitationAsset('kfgqpc-ibrahim-al-akhdar-hafs-114');
          options={audioPath:item.localPath,mushafPage:item.mushafPage};
        }
        if(!item)throw new Error('Curriculum missing: '+learner);
        const host=document.createElement('div');
        document.body.replaceChildren(host);
        window.__quranTestPlayer=mountQuranSurahPlayer(host,{
          surahNumber:item.surahNumber,surahNameAr:item.surahNameAr,...options
        });
        window.__quranTestSurah=item.surahNumber;
      },learner);
      const switcher=page.locator('.quran-itqan-toggle');
      await switcher.waitFor({timeout:25000});
      await switcher.click();
      await page.waitForFunction(()=>{
        const n=window.__quranTestSurah;
        return !!document.querySelector('.quran-mushaf-ayah-path[data-ayah="'+n+':1"]');
      },null,{timeout:15000}).catch(async error=>{
        const diag=await page.evaluate(()=>({
          chapter:window.__quranTestSurah,
          src:document.querySelector('.quran-page-image')?.currentSrc,
          imageOk:document.querySelector('.quran-page-image')?.naturalWidth,
          errors:document.querySelector('.quran-page-frame')?.dataset.imageError,
          paths:[...document.querySelectorAll('.quran-mushaf-ayah-path')].slice(0,10).map(p=>p.dataset.ayah),
          switchText:document.querySelector('.quran-itqan-toggle')?.textContent,
          sourceText:document.querySelector('.quran-itqan-source-name')?.textContent,
          text:document.querySelector('.quran-player-status')?.textContent,
          origin:location.origin
        }));
        console.log('OVERLAY_TIMEOUT_DIAGNOSTIC',name,learner,JSON.stringify(diag),errors.slice(-3));
        await page.screenshot({path:'/tmp/quran-itqan-timeout-'+name+'.png',fullPage:true});
        throw error;
      });
      await page.locator('.quran-ayah-button').first().click();
      await page.waitForFunction(()=>{
        const n=window.__quranTestSurah;
        return document.querySelector('.quran-mushaf-ayah-path[data-ayah="'+n+':1"]')?.classList.contains('is-current');
      },null,{timeout:10000});
      const state=await page.evaluate(()=>{
        const path=document.querySelector('.quran-mushaf-ayah-path.is-current');
        return {
          selected:path?.dataset.ayah,fill:path?getComputedStyle(path).fill:'',
          reciter:document.querySelector('.quran-itqan-source-name')?.textContent,
          imageReady:document.querySelector('.quran-page-image')?.naturalWidth>0
        };
      });
      if(!state.selected||!state.fill.includes('242, 197, 63')
        ||!state.reciter?.includes('تلاوة إتقان')||!state.imageReady)
        throw Error(name+' '+learner+' visual state mismatch '+JSON.stringify(state));
      if(learner==='yasser'){
        await page.locator('.quran-ayah-button').last().click();
        await page.waitForFunction(()=>window.__quranTestPlayer.getPageIndex()===5,null,{timeout:35000});
        await page.waitForFunction(()=>!!document.querySelector('.quran-mushaf-ayah-path[data-ayah="38:88"]'),null,{timeout:35000});
      }
      if(learner==='mashaal'){
        await page.locator('.quran-itqan-toggle').click();
        const back=await page.evaluate(()=>document.querySelector('.quran-itqan-toggle')?.textContent);
        if(!back?.includes('استمع بتلاوة إتقان'))throw Error('Original audio not restored');
      }
      console.log(name+' PASS '+learner+' '+JSON.stringify(state));
    }
    await page.screenshot({path:'/tmp/quran-itqan-'+name+'.png',fullPage:true});
    if(errors.length)throw Error(name+' page errors: '+errors.join('; ').slice(0,350));
  }finally{await browser.close();}
}
console.log('QURAN_ITQAN_CHROME_AND_WEBKIT_PASS');
