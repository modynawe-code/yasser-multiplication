import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL='http://127.0.0.1:4177/';
const EXPECTED_CACHE='yasser-multiplication-v4-shell-83';
const REQUIRED_CACHE_PATHS=[
  '/src/modules/mashaal/ui/mashaal-asset-contracts.js',
  '/src/modules/mashaal/ui/mashaal-guided-action-visuals.js'
];
const OUT=path.resolve('artifacts/mashaal-visual-qa');
await mkdir(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1280,height:800},
  deviceScaleFactor:1,
  serviceWorkers:'allow'
});
const page=await context.newPage();
page.setDefaultTimeout(15000);

const localFailures=[];
page.on('requestfailed',request=>{
  try{
    const url=new URL(request.url());
    if(url.origin===new URL(BASE_URL).origin)localFailures.push({url:url.pathname,failure:request.failure()?.errorText||'request failed'});
  }catch{}
});

try{
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(navigator.serviceWorker.controller)return;
    await new Promise(resolve=>{
      const timer=setTimeout(resolve,5000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});
    });
  });
  if(!await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(()=>navigator.serviceWorker.ready);
  }

  const cacheState=await page.evaluate(async({expected,required})=>{
    const keys=await caches.keys();
    const cache=await caches.open(expected);
    const cached=(await cache.keys()).map(request=>new URL(request.url).pathname);
    return {keys,missing:required.filter(path=>!cached.includes(path)),cachedCount:cached.length};
  },{expected:EXPECTED_CACHE,required:REQUIRED_CACHE_PATHS});

  if(!cacheState.keys.includes(EXPECTED_CACHE))throw new Error(`Expected cache ${EXPECTED_CACHE} was not installed. Found: ${cacheState.keys.join(', ')}`);
  if(cacheState.missing.length)throw new Error(`Mashaal offline dependencies missing from precache: ${cacheState.missing.join(', ')}`);

  localFailures.length=0;
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-learner-id="mashaal"]',{state:'visible'});
  await page.locator('[data-learner-id="mashaal"]').click();
  await page.waitForSelector('#mashaalHomeView.active');
  await page.locator('#mashaalDomainGrid [data-domain-id="language-communication"]').click();
  await page.waitForSelector('#mashaalDomainView.active');
  await page.locator('#mashaalSkillGrid [data-skill-id="oral-vocabulary-expression"]').click();
  await page.waitForSelector('#mashaalActivityView.active');
  await page.waitForSelector('#mashaalActivityStimulus [data-guided-visual="child-drinking-water"]',{state:'visible'});

  const runtimeState=await page.evaluate(()=>({
    online:navigator.onLine,
    controller:Boolean(navigator.serviceWorker.controller),
    activeView:Boolean(document.querySelector('#mashaalActivityView.active')),
    semanticVector:Boolean(document.querySelector('#mashaalActivityStimulus [data-guided-visual="child-drinking-water"]'))
  }));

  if(runtimeState.online)throw new Error('Browser still reports online during offline QA.');
  if(!runtimeState.controller||!runtimeState.activeView||!runtimeState.semanticVector)throw new Error(`Offline Mashaal runtime incomplete: ${JSON.stringify(runtimeState)}`);
  if(localFailures.length)throw new Error(`Local requests failed while offline: ${JSON.stringify(localFailures)}`);

  const report={ok:true,cache:EXPECTED_CACHE,cacheState,runtimeState,localFailures};
  await writeFile(path.join(OUT,'pwa-offline-smoke.json'),JSON.stringify(report,null,2));
  console.log(`Mashaal PWA offline QA passed: ${cacheState.cachedCount} cached requests; semantic activity rendered offline.`);
} catch(error){
  const report={ok:false,cache:EXPECTED_CACHE,localFailures,error:String(error?.stack||error)};
  await writeFile(path.join(OUT,'pwa-offline-smoke.json'),JSON.stringify(report,null,2));
  throw error;
} finally {
  await context.setOffline(false).catch(()=>{});
  await browser.close();
}
