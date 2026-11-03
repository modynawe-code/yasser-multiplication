import {cp,mkdir,rm,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const from=path.join(root,'preview-v4');
const dest=path.join(root,'dist-mobile');

const required=[
  'monopoly-party/tv/index.html',
  'monopoly-party/tv/tv.js',
  'monopoly-party/controller/index.html',
  'monopoly-party/controller/remote.js',
  'monopoly-party/shared.js',
  'monopoly-party/party.css',
  'monopoly-party/vendor/qrcode.mjs',
  'monopoly-party/vendor/LICENSE.txt',
  'src/modules/games/monopoly/monopoly-engine.js',
  'src/modules/games/monopoly/monopoly-scene.js',
  'src/modules/games/online/game-room-client.js',
  'src/modules/games/history/game-history-device-token.js',
  'src/shared/config/family-api-config.js',
  'src/modules/games/monopoly/assets/figma-arabic/board-from-variable-template.png.b64',
  'src/modules/games/monopoly/assets/audio/dice-roll-1.mp3',
  'src/modules/games/monopoly/assets/audio/dice-roll-2.mp3',
  'src/modules/games/monopoly/assets/audio/dice-roll-3.mp3'
];

await rm(dest,{recursive:true,force:true});
let copied=0;
for(const relative of required){
  const source=path.join(from,relative),destination=path.join(dest,relative);
  const size=(await stat(source)).size;
  if(size<=0)throw new Error('Empty TV dependency: '+relative);
  await mkdir(path.dirname(destination),{recursive:true});
  await cp(source,destination);
  copied+=size;
}
const index='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>احتكار المعرفة TV</title><meta http-equiv="refresh" content="0;url=monopoly-party/tv/"/></head><body><a href="monopoly-party/tv/">شغّل احتكار المعرفة TV</a></body></html>';
await writeFile(path.join(dest,'index.html'),index);
console.log('TV-only Android bundle:',required.length,'files; bytes:',copied,'(family learning app excluded)');
if(copied>3_000_000)throw new Error('TV-only web bundle unexpectedly large');
