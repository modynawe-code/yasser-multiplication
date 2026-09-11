import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const ASSETS=Object.freeze({
  'assets/visual/original/yasser/welcome.png':'3d490bb19249a808f6ad0df931c2d491616ecb66613772022175985f1b17100e',
  'assets/visual/original/yasser/thinking.png':'234aaf8044d92e0364de37cbe302ce31fe2fe948ef0ecbd2d8c2e84686870c07',
  'assets/visual/original/yasser/mastered.png':'0a3a92125dbdca1dff988802ed3ef72bdd8437d2d9ae412686a19e0c688d42bc',
  'assets/visual/original/yasser/encourage.png':'a80d718b23d2ba652382c7edeeeeca51a761eedddb8568adb04f7f9e5817fc9d',
  'assets/visual/original/yasser/celebrate.png':'1d69116f35f27a796ad8de7862256c4cd077b0f52ed3eaee0fd7ec019f90b7ee',
  'assets/visual/original/assistant/thinking.png':'f3ffa4f355f662e06be7724206d4de23da2dfd39f1ef65ace3ef9542047f1643',
  'assets/visual/original/assistant/celebrate.png':'30e11d62822366fe17c251ccf96db7b3de381fcacf134c1942fba0f6d42d4b34',
  'assets/visual/original/group/yasser-assistant-welcome.png':'2e583e729d838e2d8fc31765ae48f038e791456e852ccb257f9148bcc8071821',
  'assets/visual/original/group/yasser-assistant-thinking.png':'bcbff5a28574c90aabcd45a42a52b39eedece160549946c0bf35410cfd6afbb5',
  'assets/visual/original/group/yasser-assistant-celebration.png':'ec75acaa9c6be2f5bb06bc58aaf42293c78492a34ad087d8cd3f61d74270cf70'
});

const readText=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('Yasser approved originals remain byte-identical and are never silently recompressed',async()=>{
  for(const [path,expected] of Object.entries(ASSETS)){
    const bytes=await readFile(new URL(`../${path}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,path);
    assert.equal(bytes.subarray(1,4).toString('ascii'),'PNG',`${path} is a PNG`);
  }
});

test('visual registry points at original Yasser artwork and all approved group scenes',async()=>{
  const registry=await readText('src/ui/visual/character-assets.js');
  for(const path of [
    'original/yasser/welcome.png',
    'original/yasser/thinking.png',
    'original/yasser/encourage.png',
    'original/yasser/celebrate.png',
    'original/yasser/mastered.png',
    'original/group/yasser-assistant-welcome.png',
    'original/group/yasser-assistant-thinking.png',
    'original/group/yasser-assistant-celebration.png'
  ])assert.match(registry,new RegExp(escapeRegExp(path)));
});

test('large Yasser originals remain runtime-cached rather than blocking PWA installation',async()=>{
  const worker=await readText('service-worker.js');
  assert.match(worker,/shell-\d+/);
  assert.doesNotMatch(worker,/assets\/visual\/original\/yasser\/.*\.png/);
  assert.doesNotMatch(worker,/assets\/visual\/original\/group\/yasser-assistant-.*\.png/);
});