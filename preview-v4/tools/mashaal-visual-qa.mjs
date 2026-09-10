import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MASHAAL_KG3_ACTIVITY_CATALOG } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { createMashaalRecitationActivities } from '../src/modules/mashaal/application/recitation-activity-factory.js';

const OUT=path.resolve('artifacts/mashaal-visual-qa');
await mkdir(OUT,{recursive:true});

const VIEWPORTS=Object.freeze([
  Object.freeze({id:'desktop',width:1366,height:768}),
  Object.freeze({id:'tablet-landscape',width:1280,height:800}),
  Object.freeze({id:'tablet-portrait',width:800,height:1280})
]);
const EXPECTED_RUNTIME_ACTIVITIES=MASHAAL_KG3_ACTIVITY_CATALOG.length+createMashaalRecitationActivities('listen-repeat').length;
const VISUAL_RESOURCE_TYPES=new Set(['document','stylesheet','script','image','font']);
const safe=s=>String(s).replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'screen';

const browser=await chromium.launch({headless:true});
const report={
  expectedRuntimeActivities:EXPECTED_RUNTIME_ACTIVITIES,
  viewports:[],
  failures:[]
};

async function runViewport(viewport){
  const viewportOut=path.join(OUT,viewport.id);
  await mkdir(viewportOut,{recursive:true});
  const context=await browser.newContext({
    viewport:{width:viewport.width,height:viewport.height},
    deviceScaleFactor:1,
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(12000);

  const consoleErrors=[];
  const networkErrors=[];
  const mediaErrors=[];
  function trackNetworkIssue(request,detail){
    const resourceType=request.resourceType();
    const issue={...detail,resourceType,url:request.url()};
    if(VISUAL_RESOURCE_TYPES.has(resourceType))networkErrors.push(issue);
    else if(resourceType==='media')mediaErrors.push(issue);
  }
  page.on('console',msg=>{
    if(msg.type()==='error'&&!msg.text().startsWith('Failed to load resource:'))consoleErrors.push(msg.text());
  });
  page.on('pageerror',err=>consoleErrors.push(String(err)));
  page.on('response',response=>{
    if(response.status()>=400)trackNetworkIssue(response.request(),{status:response.status()});
  });
  page.on('requestfailed',request=>trackNetworkIssue(request,{failure:request.failure()?.errorText||'request failed'}));

  async function waitVisuals(){
    await page.waitForFunction(()=>[...document.images].every(img=>img.complete));
    await page.waitForTimeout(100);
  }

  async function coreMetrics(label){
    return page.evaluate((label)=>{
      const doc=document.documentElement;
      const active=document.querySelector('.view.active');
      const rect=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),bottom:Math.round(r.bottom),right:Math.round(r.right)};};
      const skillCards=[...(active?.querySelectorAll('.mashaal-skill-card')||[])];
      const skillCardContentOverflows=[];
      for(const [index,card] of skillCards.entries()){
        const cardRect=card.getBoundingClientRect();
        const meaningful=[...card.querySelectorAll('.mashaal-skill-preview,.mashaal-skill-copy,.mashaal-skill-copy strong,.mashaal-skill-start')];
        const overflow=meaningful.some(node=>{
          const r=node.getBoundingClientRect();
          return r.left<cardRect.left-1||r.right>cardRect.right+1||r.top<cardRect.top-1||r.bottom>cardRect.bottom+1;
        });
        if(overflow)skillCardContentOverflows.push({index,label:card.innerText.trim(),rect:rect(card)});
      }
      return {
        label,
        activeViewId:active?.id||null,
        viewportWidth:innerWidth,
        viewportHeight:innerHeight,
        bodyScrollWidth:doc.scrollWidth,
        bodyScrollHeight:doc.scrollHeight,
        overflowsViewportX:doc.scrollWidth>innerWidth+4,
        overflowsViewportY:doc.scrollHeight>innerHeight+4,
        skillCardContentOverflows,
        activeRect:active?rect(active):null
      };
    },label);
  }

  async function activityMetrics(label){
    return page.evaluate((label)=>{
      const view=document.querySelector('#mashaalActivityView.active');
      const card=view?.querySelector('.mashaal-activity-card');
      const choices=[...(view?.querySelectorAll('.mashaal-choice')||[])];
      const imgs=[...(view?.querySelectorAll('img')||[])];
      const stimulusImgs=[...(view?.querySelectorAll('#mashaalActivityStimulus img')||[])];
      const choiceImgs=[...(view?.querySelectorAll('.mashaal-choice img')||[])];
      const mediaNodes=[...(view?.querySelectorAll('.mashaal-media-visual')||[])];
      const guidedNodes=[...(view?.querySelectorAll('#mashaalActivityStimulus .mashaal-guided-action-art')||[])];
      const srcOf=img=>new URL(img.currentSrc||img.src,location.href).pathname;
      const choiceSrcs=new Set(choiceImgs.map(srcOf));
      const duplicatedStimulusChoiceImages=stimulusImgs.map(srcOf).filter(src=>choiceSrcs.has(src));
      const rect=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),bottom:Math.round(r.bottom),right:Math.round(r.right)};};
      const doc=document.documentElement;
      const layout=view?.dataset.layout||null;
      const activityType=view?.dataset.activityType||null;
      const semanticMedia=mediaNodes.map(node=>({
        role:node.dataset.assetRole||null,
        semanticFocus:node.dataset.semanticFocus||null,
        fit:node.dataset.assetFit||null,
        rect:rect(node),
        computedFit:node.querySelector('img')?getComputedStyle(node.querySelector('img')).objectFit:null,
        src:node.querySelector('img')?srcOf(node.querySelector('img')):null
      }));
      const guided=guidedNodes.map(node=>({kind:node.dataset.guidedVisual||null,rect:rect(node)}));
      const speakingVisual=view?.querySelector('[data-layout="guided-speaking"] #mashaalActivityStimulus .mashaal-media-visual')||
        (layout==='guided-speaking'?view?.querySelector('#mashaalActivityStimulus .mashaal-media-visual'):null);
      const expectedGuidedKind=layout==='guided-movement'?'balance-one-foot':layout==='guided-fine-motor'?'transfer-three-safe-pieces':null;
      const wrongGuidedBitmap=expectedGuidedKind?stimulusImgs.some(img=>/\/(balance|fine-motor)\.webp$/.test(srcOf(img))):false;
      const actionMediaFitFailures=semanticMedia.filter(item=>item.role==='action-scene'&&item.computedFit!=='cover');
      const missingSemanticContracts=semanticMedia.filter(item=>!item.role||!item.semanticFocus||!item.fit);
      const speakingRect=speakingVisual?rect(speakingVisual):null;
      const guidedSemanticFailure=expectedGuidedKind?guided.length!==1||guided[0]?.kind!==expectedGuidedKind||wrongGuidedBitmap:false;
      const undersizedGuidedVisuals=[];
      if(layout==='guided-emotion'){
        for(const node of mediaNodes){const r=rect(node);if(r.width<120||r.height<120)undersizedGuidedVisuals.push(r);}
      }
      if(expectedGuidedKind){
        for(const node of guidedNodes){const r=rect(node);if(r.width<250||r.height<140)undersizedGuidedVisuals.push(r);}
      }
      if(layout==='guided-speaking'&&speakingRect&&(speakingRect.width<280||speakingRect.height<180))undersizedGuidedVisuals.push(speakingRect);
      return {
        label,
        layout,
        activityType,
        bodyScrollHeight:doc.scrollHeight,
        bodyScrollWidth:doc.scrollWidth,
        viewportHeight:innerHeight,
        viewportWidth:innerWidth,
        overflowsViewportY:doc.scrollHeight>innerHeight+4,
        overflowsViewportX:doc.scrollWidth>innerWidth+4,
        card:card?rect(card):null,
        choices:choices.map(c=>({
          label:c.innerText.trim(),
          rect:rect(c),
          visible:c.getBoundingClientRect().bottom<=innerHeight+1&&c.getBoundingClientRect().top>=0&&c.getBoundingClientRect().right<=innerWidth+1&&c.getBoundingClientRect().left>=0
        })),
        images:imgs.map(img=>({src:srcOf(img),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,rect:rect(img)})),
        semanticMedia,
        guided,
        missingSemanticContracts,
        actionMediaFitFailures,
        guidedSemanticFailure,
        wrongGuidedBitmap,
        undersizedGuidedVisuals,
        duplicatedStimulusChoiceImages
      };
    },label);
  }

  const result={
    id:viewport.id,
    viewport:{width:viewport.width,height:viewport.height},
    expectedRuntimeActivities:EXPECTED_RUNTIME_ACTIVITIES,
    visitedActivities:0,
    domains:0,
    coreScreens:[],
    activityScreens:[],
    consoleErrors,
    networkErrors,
    mediaErrors,
    failures:[]
  };

  await page.goto('http://127.0.0.1:4177/?qa=visual',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-learner-id="mashaal"]',{state:'visible'});
  await waitVisuals();
  result.coreScreens.push(await coreMetrics('family-chooser'));
  await page.screenshot({path:path.join(viewportOut,'00-family-chooser.png'),fullPage:false});

  await page.locator('[data-learner-id="mashaal"]').click();
  await page.waitForSelector('#mashaalHomeView.active');
  await waitVisuals();
  result.coreScreens.push(await coreMetrics('mashaal-home'));
  await page.screenshot({path:path.join(viewportOut,'01-home.png'),fullPage:false});

  const domains=await page.locator('#mashaalDomainGrid [data-domain-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.domainId));
  result.domains=domains.length;
  let index=2;
  for(const domainId of domains){
    await page.locator(`#mashaalDomainGrid [data-domain-id="${domainId}"]`).click();
    await page.waitForSelector('#mashaalDomainView.active');
    await waitVisuals();
    result.coreScreens.push(await coreMetrics(`domain/${domainId}`));
    await page.screenshot({path:path.join(viewportOut,`${String(index).padStart(2,'0')}-domain-${safe(domainId)}.png`),fullPage:false});

    const skills=await page.locator('#mashaalSkillGrid [data-skill-id]:not([disabled])').evaluateAll(nodes=>nodes.map(n=>n.dataset.skillId));
    for(const skillId of skills){
      await page.locator(`#mashaalSkillGrid [data-skill-id="${skillId}"]`).click();
      await page.waitForSelector('#mashaalActivityView.active');
      await waitVisuals();

      const m=await activityMetrics(`${domainId}/${skillId}`);
      result.activityScreens.push(m);
      result.visitedActivities+=1;
      await page.screenshot({path:path.join(viewportOut,`${String(index).padStart(2,'0')}-activity-${safe(domainId)}-${safe(skillId)}.png`),fullPage:false});

      await page.locator('#mashaalActivityBack').click();
      await page.waitForSelector('#mashaalDomainView.active');
      index++;
    }
    await page.locator('#mashaalDomainBack').click();
    await page.waitForSelector('#mashaalHomeView.active');
  }

  for(const screen of result.coreScreens){
    const reasons=[];
    if(screen.overflowsViewportX)reasons.push('core-overflow-x');
    if(screen.skillCardContentOverflows.length)reasons.push('skill-card-content-overflow');
    if((screen.label==='family-chooser'||screen.label==='mashaal-home')&&screen.overflowsViewportY)reasons.push('core-primary-screen-overflow-y');
    if(reasons.length)result.failures.push({screen:screen.label,reasons});
  }
  for(const screen of result.activityScreens){
    const reasons=[];
    if(screen.overflowsViewportY)reasons.push('viewport-overflow-y');
    if(screen.overflowsViewportX)reasons.push('viewport-overflow-x');
    if(screen.choices.some(choice=>!choice.visible))reasons.push('choice-outside-viewport');
    if(screen.images.some(img=>img.naturalWidth===0||img.naturalHeight===0))reasons.push('broken-image');
    if(screen.duplicatedStimulusChoiceImages.length)reasons.push('answer-leak-duplicate-image');
    if(screen.undersizedGuidedVisuals.length)reasons.push('undersized-guided-visual');
    if(screen.missingSemanticContracts.length)reasons.push('missing-asset-contract');
    if(screen.actionMediaFitFailures.length)reasons.push('action-crop-contract-not-applied');
    if(screen.guidedSemanticFailure)reasons.push('guided-semantic-renderer-mismatch');
    if(reasons.length)result.failures.push({screen:screen.label,reasons});
  }
  if(result.visitedActivities!==EXPECTED_RUNTIME_ACTIVITIES){
    result.failures.push({screen:'coverage',reasons:[`expected-${EXPECTED_RUNTIME_ACTIVITIES}-visited-${result.visitedActivities}`]});
  }
  if(domains.length!==6)result.failures.push({screen:'domain-coverage',reasons:[`expected-6-found-${domains.length}`]});
  if(consoleErrors.length)result.failures.push({screen:'console',reasons:[`${consoleErrors.length}-console-errors`]});
  if(networkErrors.length)result.failures.push({screen:'network',reasons:[`${networkErrors.length}-visual-network-errors`]});
  const mediaHttpErrors=mediaErrors.filter(issue=>Number(issue.status)>=400);
  if(mediaHttpErrors.length)result.failures.push({screen:'media-http',reasons:[`${mediaHttpErrors.length}-media-http-errors`]});

  await writeFile(path.join(viewportOut,'report.json'),JSON.stringify(result,null,2));
  await context.close();
  return result;
}

for(const viewport of VIEWPORTS){
  const result=await runViewport(viewport);
  report.viewports.push(result);
  if(result.failures.length)report.failures.push({viewport:viewport.id,failures:result.failures});
}

await writeFile(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({
  expectedRuntimeActivities:EXPECTED_RUNTIME_ACTIVITIES,
  viewports:report.viewports.map(item=>({
    id:item.id,
    visitedActivities:item.visitedActivities,
    domains:item.domains,
    failures:item.failures.length,
    consoleErrors:item.consoleErrors.length,
    visualNetworkErrors:item.networkErrors.length,
    mediaErrors:item.mediaErrors.length,
    mediaHttpErrors:item.mediaErrors.filter(issue=>Number(issue.status)>=400).length
  })),
  failedViewports:report.failures.map(item=>item.viewport)
},null,2));

await browser.close();
if(report.failures.length)process.exitCode=1;
