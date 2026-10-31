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
          imageReady:document.querySelector('.quran-page-image')?.naturalWidth>0,
          versePosition:document.querySelector('.quran-verse-position')?.textContent
        };
      });
      if(!state.selected||!state.fill.includes('242, 197, 63')
        ||!state.reciter?.includes('تلاوة إتقان')||!state.imageReady
        ||!state.versePosition?.includes('الآية 1 من'))
        throw Error(name+' '+learner+' visual state mismatch '+JSON.stringify(state));
      if(learner==='khaled'||learner==='mashaal'){
        const aligned=await page.evaluate(()=>{
          const viewport=document.querySelector('.quran-page-viewport');
          const image=document.querySelector('.quran-page-image');
          const overlay=document.querySelector('.quran-mushaf-ayah-overlay');
          const a=image?.getBoundingClientRect(),b=overlay?.getBoundingClientRect();
          return {focused:viewport?.dataset.focused,sourceView:viewport?.dataset.sourceView,
            imageY:a?.top,overlayY:b?.top,imageHeight:a?.height,overlayHeight:b?.height};
        });
        if((aligned.focused!=='true'&&aligned.sourceView!=='true')
          ||Math.abs(aligned.imageY-aligned.overlayY)>3
          ||Math.abs(aligned.imageHeight-aligned.overlayHeight)>3)
          throw Error(name+' '+learner+' focused short-surah geometry misaligned '+JSON.stringify(aligned));
      }
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
    // Real browser gate for the three already-bundled pages, including
    // Al-Fatiha (page 1), which previously tried only blocked remote sources.
    for(const [surah,number] of [[1,1],[111,603],[113,604]]){
      await page.evaluate(async surahNumber=>{
        window.__quranTestPlayer?.destroy?.();
        const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
        const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
        const chapter=Object.values(KHALED_QURAN_TERMS).flat().find(s=>s.surahNumber===surahNumber);
        if(!chapter)throw Error('Missing bundled chapter '+surahNumber);
        const host=document.createElement('div');
        document.body.replaceChildren(host);
        window.__quranTestPlayer=mountQuranSurahPlayer(host,{
          surahNumber:chapter.surahNumber,surahNameAr:chapter.surahNameAr,
          audioPath:chapter.audioPath,mushafPage:chapter.mushafPage
        });
      },surah);
      await page.waitForFunction(()=>{
        const image=document.querySelector('.quran-page-image');
        return image?.complete&&image.naturalWidth>0
          ||document.querySelector('.quran-page-frame')?.dataset.imageError==='true';
      },null,{timeout:15000});
      const loaded=await page.evaluate(()=>({
        src:document.querySelector('.quran-page-image')?.currentSrc||'',
        width:document.querySelector('.quran-page-image')?.naturalWidth||0,
        error:document.querySelector('.quran-page-frame')?.dataset.imageError||''
      }));
      if(!loaded.width||loaded.error||!new RegExp('/kfqc-hafs-page-'+number+'(?:-surah\\d+)?\\.svg
        throw Error(name+' bundled mushaf page '+number+' failed '+JSON.stringify(loaded));
      console.log(name+' BUNDLED_MUSHAF_PAGE_PASS '+number);
    }
    // QUR-02 regression: page 602 previously leaked the previous surah's
    // last line above Al-Maun. Require a crop derived from real page polygons,
    // not merely the old manually estimated viewport percentages.
    await page.evaluate(async()=>{
      window.__quranTestPlayer?.destroy?.();
      const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
      const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
      const item=KHALED_QURAN_TERMS[1].find(x=>x.surahNumber===107);
      if(!item)throw Error('Al-Maun is missing from Khaled curriculum');
      const host=document.createElement('div');
      document.body.replaceChildren(host);
      window.__quranTestPlayer=mountQuranSurahPlayer(host,{
        surahNumber:item.surahNumber,surahNameAr:item.surahNameAr,
        mushafPage:item.mushafPage,audioPath:item.audioPath
      });
    });
    await page.waitForFunction(()=>{
      const viewport=document.querySelector('.quran-page-viewport');
      return viewport?.dataset.officialFocus==='true'
        ||document.querySelector('.quran-page-frame')?.dataset.imageError==='true';
    },null,{timeout:35000});
    const maun=await page.evaluate(()=>({
      official:document.querySelector('.quran-page-viewport')?.dataset.officialFocus,
      src:document.querySelector('.quran-page-image')?.currentSrc,
      width:document.querySelector('.quran-page-image')?.naturalWidth,
      cropped:document.querySelector('.quran-page-image')?.style.transform,
      failed:document.querySelector('.quran-page-frame')?.dataset.imageError
    }));
    if(maun.official!=='true'||!maun.width||maun.failed)
      throw Error(name+' Al-Maun official-focus failed '+JSON.stringify(maun));
    // Publisher-native per-surah SVG must show the original artwork with a
    // source-defined viewBox and the matching, unshifted ayah polygons.
    await page.waitForFunction(()=>document.querySelector('.quran-page-viewport')?.dataset.sourceView==='true',
      null,{timeout:20000});
    const native=await page.evaluate(()=>{
      const image=document.querySelector('.quran-page-image');
      const overlay=document.querySelector('.quran-mushaf-ayah-overlay');
      const viewport=document.querySelector('.quran-page-viewport');
      const a=image?.getBoundingClientRect(),b=overlay?.getBoundingClientRect();
      return {src:image?.currentSrc||'',sourceView:viewport?.dataset.sourceView,
        transform:image?.style.transform||'',overlayHeight:b?.height,imageHeight:a?.height};
    });
    if(!native.src.includes('kfqc-hafs-page-602-surah107.svg')
      ||native.sourceView!=='true'||native.transform
      ||Math.abs(native.imageHeight-native.overlayHeight)>3)
      throw Error(name+' publisher surah SVG misaligned '+JSON.stringify(native));
    await page.locator('.quran-full-page-toggle').click();
    await page.waitForFunction(()=>{
      const image=document.querySelector('.quran-page-image');
      return image?.currentSrc.includes('kfqc-hafs-page-602.svg')&&image.complete;
    },null,{timeout:15000});
    await page.locator('.quran-full-page-toggle').click();
    await page.waitForFunction(()=>document.querySelector('.quran-page-viewport')?.dataset.sourceView==='true',
      null,{timeout:15000});
    console.log(name+' PUBLISHER_NATIVE_SURAH_VIEW_PASS',JSON.stringify(native));
    console.log(name+' SURAH_107_OFFICIAL_CROP_PASS');
    // Al-Adiyat verse 10 belongs to the next authentic page (600).
    // Test that the local pinned page map follows it without a CDN call.
    await page.evaluate(async()=>{
      window.__quranTestPlayer?.destroy?.();
      const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
      const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
      const {loadQuranCoursePages}=await import('./src/shared/quran/quran-course-page-map.js');
      const chapter=KHALED_QURAN_TERMS[2].find(x=>x.surahNumber===100);
      if(!chapter)throw Error('Missing Al-Adiyat chapter');
      const pages=await loadQuranCoursePages(chapter);
      if(pages.map(p=>p.pageNumber).join(',')!=='599,600')
        throw Error('Verified two-page Al-Adiyat mapping unavailable');
      const host=document.createElement('div');document.body.replaceChildren(host);
      window.__quranTestPlayer=mountQuranSurahPlayer(host,{
        learnerId:'khaled',surahNumber:100,surahNameAr:chapter.surahNameAr,
        audioPath:chapter.audioPath,mushafPage:pages[0],mushafPages:pages
      });
    });
    await page.locator('.quran-itqan-toggle').waitFor({timeout:15000});
    await page.locator('.quran-itqan-toggle').click();
    await page.locator('.quran-ayah-button').nth(9).click();
    await page.waitForFunction(()=>window.__quranTestPlayer?.getPageIndex()===1,
      null,{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('.quran-mushaf-ayah-path[data-ayah="100:10"]'),
      null,{timeout:15000});
    const continued=await page.evaluate(()=>({
      image:document.querySelector('.quran-page-image')?.currentSrc,
      imageWidth:document.querySelector('.quran-page-image')?.naturalWidth,
      index:window.__quranTestPlayer.getPageIndex()
    }));
    if(continued.index!==1||!continued.image?.includes('kfqc-hafs-page-600.svg')||!continued.imageWidth)
      throw Error(name+' offline page continuation failed '+JSON.stringify(continued));
    console.log(name+' OFFLINE_AYAH_PAGE_FOLLOW_PASS',JSON.stringify(continued));
    await page.screenshot({path:'/tmp/quran-itqan-'+name+'.png',fullPage:true});
    if(errors.length)throw Error(name+' page errors: '+errors.join('; ').slice(0,350));
  }finally{await browser.close();}
}
console.log('QURAN_ITQAN_CHROME_AND_WEBKIT_PASS');
).test(loaded.src))
        throw Error(name+' bundled mushaf page '+number+' failed '+JSON.stringify(loaded));
      console.log(name+' BUNDLED_MUSHAF_PAGE_PASS '+number);
    }
    // QUR-02 regression: page 602 previously leaked the previous surah's
    // last line above Al-Maun. Require a crop derived from real page polygons,
    // not merely the old manually estimated viewport percentages.
    await page.evaluate(async()=>{
      window.__quranTestPlayer?.destroy?.();
      const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
      const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
      const item=KHALED_QURAN_TERMS[1].find(x=>x.surahNumber===107);
      if(!item)throw Error('Al-Maun is missing from Khaled curriculum');
      const host=document.createElement('div');
      document.body.replaceChildren(host);
      window.__quranTestPlayer=mountQuranSurahPlayer(host,{
        surahNumber:item.surahNumber,surahNameAr:item.surahNameAr,
        mushafPage:item.mushafPage,audioPath:item.audioPath
      });
    });
    await page.waitForFunction(()=>{
      const viewport=document.querySelector('.quran-page-viewport');
      return viewport?.dataset.officialFocus==='true'
        ||document.querySelector('.quran-page-frame')?.dataset.imageError==='true';
    },null,{timeout:35000});
    const maun=await page.evaluate(()=>({
      official:document.querySelector('.quran-page-viewport')?.dataset.officialFocus,
      src:document.querySelector('.quran-page-image')?.currentSrc,
      width:document.querySelector('.quran-page-image')?.naturalWidth,
      cropped:document.querySelector('.quran-page-image')?.style.transform,
      failed:document.querySelector('.quran-page-frame')?.dataset.imageError
    }));
    if(maun.official!=='true'||!maun.width||maun.failed)
      throw Error(name+' Al-Maun official-focus failed '+JSON.stringify(maun));
    console.log(name+' SURAH_107_OFFICIAL_CROP_PASS');
    // Al-Adiyat verse 10 belongs to the next authentic page (600).
    // Test that the local pinned page map follows it without a CDN call.
    await page.evaluate(async()=>{
      window.__quranTestPlayer?.destroy?.();
      const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
      const {KHALED_QURAN_TERMS}=await import('./src/modules/khaled/quran/khaled-quran.js');
      const {loadQuranCoursePages}=await import('./src/shared/quran/quran-course-page-map.js');
      const chapter=KHALED_QURAN_TERMS[2].find(x=>x.surahNumber===100);
      if(!chapter)throw Error('Missing Al-Adiyat chapter');
      const pages=await loadQuranCoursePages(chapter);
      if(pages.map(p=>p.pageNumber).join(',')!=='599,600')
        throw Error('Verified two-page Al-Adiyat mapping unavailable');
      const host=document.createElement('div');document.body.replaceChildren(host);
      window.__quranTestPlayer=mountQuranSurahPlayer(host,{
        learnerId:'khaled',surahNumber:100,surahNameAr:chapter.surahNameAr,
        audioPath:chapter.audioPath,mushafPage:pages[0],mushafPages:pages
      });
    });
    await page.locator('.quran-itqan-toggle').waitFor({timeout:15000});
    await page.locator('.quran-itqan-toggle').click();
    await page.locator('.quran-ayah-button').nth(9).click();
    await page.waitForFunction(()=>window.__quranTestPlayer?.getPageIndex()===1,
      null,{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('.quran-mushaf-ayah-path[data-ayah="100:10"]'),
      null,{timeout:15000});
    const continued=await page.evaluate(()=>({
      image:document.querySelector('.quran-page-image')?.currentSrc,
      imageWidth:document.querySelector('.quran-page-image')?.naturalWidth,
      index:window.__quranTestPlayer.getPageIndex()
    }));
    if(continued.index!==1||!continued.image?.includes('kfqc-hafs-page-600.svg')||!continued.imageWidth)
      throw Error(name+' offline page continuation failed '+JSON.stringify(continued));
    console.log(name+' OFFLINE_AYAH_PAGE_FOLLOW_PASS',JSON.stringify(continued));
    await page.screenshot({path:'/tmp/quran-itqan-'+name+'.png',fullPage:true});
    if(errors.length)throw Error(name+' page errors: '+errors.join('; ').slice(0,350));
  }finally{await browser.close();}
}
console.log('QURAN_ITQAN_CHROME_AND_WEBKIT_PASS');
