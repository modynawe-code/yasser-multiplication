import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('student views expose stable visual slots without coupling assets into HTML',async()=>{
  const html=await read('index.html');
  const css=await read('src/ui/styles/character-system.css');

  assert.match(html,/src\/ui\/styles\/character-system\.css/);

  for(const id of ['introYasser','introAssistant','homeYasser','homeAssistant','learnYasser','learnAssistant','sessionYasser','sessionAssistant','resultYasser','resultAssistant']){
    assert.match(html,new RegExp(`id="${id}"`));
  }

  assert.match(html,/id="introStart"/);
  assert.doesNotMatch(html,/assets\/visual\/.*\.b64\.txt/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/exam-mode/);
  assert.match(css,/intro-characters/);
  assert.match(css,/session-visuals[\s\S]*display:grid/);
  assert.doesNotMatch(css,/session-yasser\{position:absolute/);
  assert.doesNotMatch(css,/session-assistant\{position:absolute/);
});

test('learning flow keeps distinct success and mistake visuals visible until the next question',async()=>{
  const controller=await read('src/ui/app-controller.js');
  const scenes=await read('src/ui/visual/scene-manifest.js');
  const sceneController=await read('src/ui/visual/scene-controller.js');

  assert.match(controller,/const VIEWS=\['introView'/);
  assert.match(controller,/\$\('introStart'\)\.onclick=goHome/);
  assert.match(controller,/visuals\.render\('intro'\)/);
  assert.match(controller,/visuals\.render\('correct'\)/);
  assert.match(controller,/visuals\.render\('wrong'\)/);
  assert.match(controller,/setTimeout\(renderQuestion,\(visualHold\|\|fallbackHold\)\+100\)/);
  assert.match(controller,/visuals\.result\(pct\)/);

  assert.match(scenes,/intro:\{target:'intro',yasser:'encourage',assistant:'idle'\}/);
  assert.match(scenes,/home:\{target:'home',yasser:'encourage',assistant:'idle'\}/);
  assert.match(scenes,/question:\{target:'session',yasser:'thinking',assistant:'thinking'\}/);
  assert.match(scenes,/correct:\{target:'session',yasser:'celebrate',assistant:'celebrate',duration:1700/);
  assert.match(scenes,/wrong:\{target:'session',yasser:'encourage',assistant:'thinking',duration:2400/);
  assert.match(sceneController,/intro:\{yasser:'introYasser',assistant:'introAssistant'\}/);
  assert.match(sceneController,/return scene\.duration\|\|0/);
  assert.doesNotMatch(sceneController,/hideAll\(\)/);
  assert.match(sceneController,/await setVisualImage/);
});

test('mobile visual loader does not expose a broken image while state assets load',async()=>{
  const assets=await read('src/ui/visual/character-assets.js');

  assert.match(assets,/data:image\/webp;base64/);
  assert.doesNotMatch(assets,/createObjectURL/);
  assert.match(assets,/previousSource/);
  assert.match(assets,/loadFallbackUrl/);
  assert.match(assets,/image\.hidden=true/);
  assert.match(assets,/assets\/characters\/yasser-welcome\.webp/);
  assert.match(assets,/assets\/assistant\/assistant-welcome\.webp/);
});

test('preview service worker refreshes shell from network and preserves offline fallback',async()=>{
  const worker=await read('service-worker.js');

  assert.match(worker,/shell-11/);
  assert.match(worker,/cache:'reload'/);
  assert.match(worker,/cache:'no-store'/);
  assert.match(worker,/client\.navigate\(client\.url\)/);
  assert.match(worker,/character-system\.css/);
  assert.match(worker,/scene-controller\.js/);
  assert.match(worker,/character-assets\.js/);

  for(const asset of ['yasser\/welcome','yasser\/thinking','yasser\/encourage','yasser\/celebrate','yasser\/mastered','assistant\/idle','assistant\/thinking','assistant\/celebrate']){
    assert.match(worker,new RegExp(`assets/visual/${asset}\\.b64\\.txt`));
  }
});
