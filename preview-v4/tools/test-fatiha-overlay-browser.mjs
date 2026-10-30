/**
 * Live Chromium visual/DOM smoke test for the ISOLATED (cloud-disabled) pilot.
 * This is not a substitute for Safari/iPad/Galaxy Tab hardware validation.
 * Requires: playwright-core, google-chrome available on GitHub's Ubuntu runner.
 */
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';

const base=process.env.FATIHA_PILOT_URL
  ||'https://family-learning-fatiha-pilot.modynawe.workers.dev';
const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const failures=[];
try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(async()=>{
    const {mountQuranSurahPlayer}=await import('./src/modules/mashaal/quran/quran-surah-player.js');
    const {getMashaalRecitationAsset}=await import('./src/modules/mashaal/curriculum/recitation-media-manifest.js');
    const {verifiedFatihaReviewPilot}=await import('./src/modules/khaled/quran/fatiha-review-candidate.js');
    const asset=getMashaalRecitationAsset('kfgqpc-ibrahim-al-akhdar-hafs-1');
    const source=verifiedFatihaReviewPilot(asset);
    if(!source)throw new Error('No exact-asset Fatiha review data');
    // Test the same production player as Khaled's pilot, without touching any
    // actual learner state or family cloud sync.
    document.body.replaceChildren();
    document.body.style.background='#f7f6f2';
    const host=document.createElement('div');
    document.body.append(host);
    window.__qaPlayer=mountQuranSurahPlayer(host,{
      surahNameAr:'الفاتحة',surahNumber:1,
      audioPath:source.audioPath,mushafPage:source.mushafPage,
      ayahTimings:source.ayahTimings,durationSeconds:source.durationSeconds
    });
  });
  await page.waitForSelector('.quran-mushaf-ayah-path',{timeout:12000});
  await page.waitForFunction(()=>{
    const img=document.querySelector('.quran-page-image');
    const sheet=[...document.styleSheets].some(s=>s.href?.includes('quran-surah-player.css'));
    return !!img&&img.complete&&img.naturalWidth>0&&sheet;
  },{timeout:15000});
  await page.locator('.quran-ayah-button').nth(1).click();
  const state=await page.evaluate(()=>{
    const img=document.querySelector('.quran-page-image');
    const svg=document.querySelector('svg.quran-mushaf-ayah-overlay');
    const path=svg?.querySelector('path[data-ayah="1:2"]');
    const image=img.getBoundingClientRect(),overlay=svg.getBoundingClientRect();
    const selectedPath=path?.classList.contains('is-current');
    const fill=path?getComputedStyle(path).fill:'missing';
    const display=svg?getComputedStyle(svg).display:'none';
    const opacity=svg?getComputedStyle(svg).opacity:'0';
    const bbox=path?.getBBox();
    const matrix=path?.getScreenCTM();
    const point=svg?.createSVGPoint();
    if(point&&bbox){point.x=bbox.x+bbox.width/2;point.y=bbox.y+bbox.height/2;}
    const hit=point&&matrix?point.matrixTransform(matrix):null;
    const hitNode=hit?document.elementFromPoint(hit.x,hit.y):null;
    return {
      selectedPath,fill,display,opacity,pathCount:svg?.querySelectorAll('path').length,
      imageLoaded:img.complete&&img.naturalWidth>0,
      image:{w:image.width,h:image.height,x:image.x,y:image.y},
      overlay:{w:overlay.width,h:overlay.height,x:overlay.x,y:overlay.y},
      hitTarget:hitNode?.getAttribute('data-ayah')||hitNode?.nodeName||'none',
      selectedButton:document.querySelector('.quran-ayah-button[data-ayah="1:2"]')?.className,
      source:img.currentSrc
    };
  });
  console.log('Chrome real visual overlay state:',JSON.stringify(state,null,2));
  if(!state.selectedPath)failures.push('second verse did not become active');
  if(state.pathCount!==7)failures.push('seven exact polygons not created');
  if(!state.imageLoaded)failures.push('bundled SVG image did not load');
  if(state.display==='none'||state.opacity==='0'||state.fill==='rgba(0, 0, 0, 0)'||state.fill==='transparent')
    failures.push('active polygon is transparent or hidden');
  if(Math.abs(state.image.w-state.overlay.w)>2||Math.abs(state.image.h-state.overlay.h)>2)
    failures.push('overlay geometry does not match the image box');
  if(!String(state.selectedButton).includes('is-current'))failures.push('button tracking not in sync');
  if(state.hitTarget!=='1:2')failures.push('tap hit testing misses verse 2');
  if(errors.length)failures.push('browser errors: '+errors.slice(0,3).join(';'));
  await mkdir(dirname('/tmp/fatiha-pilot-visual-qa.png'),{recursive:true});
  await page.screenshot({path:'/tmp/fatiha-pilot-visual-qa.png',fullPage:true});
  if(failures.length)throw new Error('Visual QA failed: '+failures.join('; '));
  console.log('CHROME_VISUAL_QA_PASS: image, highlighted verse 2, hit target, button sync, geometry');
}finally{
  await browser.close();
}
