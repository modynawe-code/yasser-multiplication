import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('board rendering reuses stable tileId nodes and skips unchanged layout plans',async()=>{
  const [controller,visuals,css]=await Promise.all([
    read('src/modules/games/domino/domino-controller.js'),
    read('src/modules/games/domino/domino-visuals.js'),
    read('src/modules/games/domino/domino-chain-layout.css')
  ]);
  assert.match(controller,/new Map\([^\n]+data-domino-id/);
  assert.match(controller,/existing\.get\(item\.tileId\)\|\|createBoardTile\(item\)/);
  assert.match(controller,/find\(candidate=>candidate\?\.opening===true\)/);
  assert.match(controller,/host\.dataset\.anchorId=visualAnchorId/);
  assert.doesNotMatch(controller,/host\.innerHTML=state\.board\.map/);
  assert.match(visuals,/tile\.dataset\.dominoId===anchorId/);
  assert.match(visuals,/layoutSignature===signature/);
  assert.doesNotMatch(css,/transition:[^\n}]*(?:left|top|transform)/);
});
