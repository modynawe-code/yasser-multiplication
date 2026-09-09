import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT=path.resolve('artifacts/mashaal-visual-qa');
await mkdir(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1366,height:768},
  deviceScaleFactor:1,
  serviceWorkers:'block'
});
const page=await context.newPage();
page.setDefaultTimeout(12000);

const consoleErrors=[];
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
page.on('pageerror',err=>consoleErrors.push(String(err)));

async function waitVisuals(){
  await page.waitForFunction(()=>[...document.images].every(img=>img.complete));
  await page.waitForTimeout(80);
}

await page.goto('http://127.0.0.1:4177/?qa=visual',{waitUntil:'domcontentloaded'});
await page.waitForSelector('[data-learner-id="mashaal"]',{state:'visible'});
await page.locator('[data-learner-id="mashaal"]').click();
await page.waitForSelector('#mashaalHomeView.active');
await waitVisuals();
await page.screenshot({path:path.join(OUT,'00-home.png'),fullPage:true});

const result={
  viewport:{width:1366,height:768},
  screens:[],
  consoleErrors,
  failures:[]
};
const safe=s=>String(s).replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'screen';

async function metrics(label){
  return page.evaluate((label)=>{
    const view=document.querySelector('#mashaalActivityView.active');
    const card=view?.querySelector('.mashaal-activity-card');
    const choices=[...(view?.querySelectorAll('.mashaal-choice')||[])];
    const imgs=[...(view?.querySelectorAll('img')||[])];
    const stimulusImgs=[...(view?.querySelectorAll('#mashaalActivityStimulus img')||[])];
    const choiceImgs=[...(view?.querySelectorAll('.mashaal-choice img')||[])];
    const srcOf=img=>new URL(img.currentSrc||img.src,location.href).pathname;
    const choiceSrcs=new Set(choiceImgs.map(srcOf));
    const duplicatedStimulusChoiceImages=stimulusImgs.map(srcOf).filter(src=>choiceSrcs.has(src));
    const rect=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),bottom:Math.round(r.bottom),right:Math.round(r.right)};};
    const doc=document.documentElement;
    return {
      label,
      layout:view?.dataset.layout||null,
      stimulusKind:view?.dataset.stimulusKind||null,
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
      images:imgs.map(img=>({
        src:srcOf(img),
        naturalWidth:img.naturalWidth,
        naturalHeight:img.naturalHeight,
        rect:rect(img)
      })),
      duplicatedStimulusChoiceImages
    };
  },label);
}

const domains=await page.locator('#mashaalDomainGrid [data-domain-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.domainId));
let index=1;
for(const domainId of domains){
  await page.locator(`#mashaalDomainGrid [data-domain-id="${domainId}"]`).click();
  await page.waitForSelector('#mashaalDomainView.active');
  await waitVisuals();
  await page.screenshot({path:path.join(OUT,`${String(index).padStart(2,'0')}-domain-${safe(domainId)}.png`),fullPage:true});

  const skills=await page.locator('#mashaalSkillGrid [data-skill-id]:not([disabled])').evaluateAll(nodes=>nodes.map(n=>n.dataset.skillId));
  for(const skillId of skills){
    await page.locator(`#mashaalSkillGrid [data-skill-id="${skillId}"]`).click();
    await page.waitForSelector('#mashaalActivityView.active');
    await waitVisuals();

    const m=await metrics(`${domainId}/${skillId}`);
    result.screens.push(m);
    await page.screenshot({path:path.join(OUT,`${String(index).padStart(2,'0')}-activity-${safe(domainId)}-${safe(skillId)}.png`),fullPage:true});

    await page.locator('#mashaalActivityBack').click();
    await page.waitForSelector('#mashaalDomainView.active');
    index++;
  }
  await page.locator('#mashaalDomainBack').click();
  await page.waitForSelector('#mashaalHomeView.active');
}

result.failures=result.screens.filter(screen=>
  screen.overflowsViewportY||
  screen.overflowsViewportX||
  screen.choices.some(choice=>!choice.visible)||
  screen.images.some(img=>img.naturalWidth===0||img.naturalHeight===0)||
  screen.duplicatedStimulusChoiceImages.length>0
);

await writeFile(path.join(OUT,'report.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({
  screens:result.screens.length,
  failures:result.failures.length,
  consoleErrors:consoleErrors.length,
  failedScreens:result.failures.map(item=>item.label)
},null,2));

await browser.close();
if(result.failures.length||consoleErrors.length)process.exitCode=1;
