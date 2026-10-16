// Run with Playwright installed. Optional: PLAYWRIGHT_MODULE, CHROMIUM_EXECUTABLE, QA_OUTPUT.
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=process.env.QA_OUTPUT||'/tmp/khaled-letter-forms-qa';
await mkdir(out,{recursive:true});
const harness='<!doctype html><html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>body{padding:12px}.view{display:none}.view.active{display:block}</style><main></main></html>';
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/__letter-qa'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(harness);return;}
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('outside root');
  const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4'};
  res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const results=[];
try{
 for(const size of [{id:'mobile',width:390,height:844},{id:'tablet-portrait',width:800,height:1280},{id:'tablet-landscape',width:1280,height:800}]){
  const context=await browser.newContext({viewport:size,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function boot(){
   await page.goto(base+'/__letter-qa');
   await page.evaluate(async()=>{
    const {createKhaledLiteracyController}=await import('/src/modules/khaled/literacy/khaled-literacy.js');
    const showView=id=>document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    window.literacy=createKhaledLiteracyController({showView,onBack(){}});literacy.open();
   });
   await page.locator('#khaledLetterFormsOpen').click();await page.locator('[data-letter]').first().waitFor();
  }
  await boot();assert.equal(await page.locator('[data-letter]').count(),28);
  await page.screenshot({path:path.join(out,size.id+'-picker.png'),fullPage:true});
  for(const char of ['ب','ص','د','ع','ه','ي']){
   await page.locator(`[data-letter="${char}"]`).click();
   for(const b of await page.locator('[data-form]').all()){
    await b.click();
    const invalid=await page.locator('.lf-glyph path').evaluateAll(paths=>paths.some(p=>{const b=p.getBBox();return !p.getTotalLength()||b.x<0||b.y<0||b.x+b.width>500||b.y+b.height>340;}));
    assert.equal(invalid,false,char+' bounds');
   }
   await page.locator('[data-action="letters"]').click();
  }
  await page.locator('[data-letter="ص"]').click();await page.locator('[data-stage="1"]').click();
  await page.locator('[data-example="4"]').click();assert.match(await page.locator('.lf-example-word').textContent(),/أصفر/);
  assert.deepEqual(await page.locator('.lf-connection-labels span').allTextContents(),['منفصل عن السابق','يتصل بالحرف التالي']);
  await page.screenshot({path:path.join(out,size.id+'-connection.png'),fullPage:true});
  await page.locator('[data-stage="2"]').click();
  // First example is صباح, so the correct form connects onwards only.
  await page.locator('[data-answer="isolated"]').click();assert.match(await page.locator('.lf-feedback').textContent(),/حاول/);
  await page.locator('[data-answer="initial"]').click();assert.match(await page.locator('.lf-feedback').textContent(),/صحيح/);
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('family.khaled.letter-forms.v1')));
  assert.equal(Object.keys(record.letters['ص'].assisted).length,1);assert.equal(record.letters['ص'].independent,undefined);
  await page.locator('[data-stage="3"]').click();await page.locator('[data-form="medial"]').click();
  await page.locator('.lf-writing-board').scrollIntoViewIfNeeded();
  // Real mouse pointer events use SVG CTM, including letterboxed landscape SVGs.
  const points=await page.locator('.lf-writing-board').evaluate(svg=>Array.from(svg.querySelectorAll('.lf-guide-path')).map(p=>{const n=Math.max(1,Math.ceil(p.getTotalLength()/4));return Array.from({length:n+1},(_,i)=>{const q=p.getPointAtLength(p.getTotalLength()*i/n),s=svg.createSVGPoint();s.x=q.x;s.y=q.y;const v=s.matrixTransform(svg.getScreenCTM());return {x:v.x,y:v.y};});}));
  for(const stroke of points){await page.mouse.move(stroke[0].x,stroke[0].y);await page.mouse.down();for(const p of stroke)await page.mouse.move(p.x,p.y);await page.mouse.up();}
  assert.match(await page.locator('.lf-feedback').textContent(),/أكملت تتبع/);
  await page.screenshot({path:path.join(out,size.id+'-writing.png'),fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,size.id+' horizontal overflow');
  await boot();await page.locator('[data-action="resume"]').click();
  assert.equal(await page.locator('[data-form="medial"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.lf-stroke-done').count(),points.length);
  await page.locator('[data-mode="free"]').click();assert.match(await page.locator('.lf-feedback').textContent(),/لا تحصل على حكم آلي/);
  await page.locator('[data-action="back"]').click();assert.equal(await page.locator('#khaledLiteracyLibrary').isVisible(),true);assert.equal(await page.locator('[data-literacy-video]').count(),8);
  assert.deepEqual(errors,[]);results.push({viewport:size.id,letters:28,connection:true,answerTracking:true,orderedTracing:true,restore:true,overflow:false,errors});await context.close();
 }
 console.log(JSON.stringify(results,null,2));await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
