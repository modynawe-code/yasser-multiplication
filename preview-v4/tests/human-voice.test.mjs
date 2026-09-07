import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { humanVoiceAssetPath,humanVoiceTextHash,normalizeVoiceText } from '../src/shared/audio/human-voice-assets.js';
import { HUMAN_VOICE_POLICY } from '../src/shared/audio/human-voice-policy.js';
import { resolveVoiceAsset,VOICE_MANIFEST } from '../src/shared/audio/voice-manifest.js';
import { createVoiceService } from '../src/shared/audio/voice-service.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('dynamic human voice paths are stable across harmless whitespace differences',()=>{
  const compact='كم ناتج 3 ضرب 4؟';
  const spaced='  كم ناتج   3 ضرب 4؟  ';
  assert.equal(normalizeVoiceText(spaced),compact);
  assert.equal(humanVoiceTextHash(spaced),humanVoiceTextHash(compact));
  assert.equal(humanVoiceAssetPath(spaced),humanVoiceAssetPath(compact));
  assert.match(humanVoiceAssetPath(compact),/^assets\/audio\/human\/[0-9a-f]{16}\.mp3$/);
});

test('voice manifest keeps semantic recordings and gives every dynamic prompt a deterministic human path',()=>{
  assert.equal(resolveVoiceAsset('games.rps.turn.yasser',VOICE_MANIFEST,'ignored'),VOICE_MANIFEST['games.rps.turn.yasser']);
  const dynamic=resolveVoiceAsset(null,VOICE_MANIFEST,'اختر العدد 7.');
  assert.equal(dynamic,humanVoiceAssetPath('اختر العدد 7.'));
});

test('human-only mode contains no neural native or browser speech provider',()=>{
  const voice=createVoiceService({
    mode:'human-only',
    AudioClass:null,
    neuralProvider:{kind:'neural',async speak(){return true;}},
    nativeTts:{async speak(){},async stop(){}},
    synth:{speak(){},cancel(){},getVoices(){return[];}},
    Utterance:class{}
  });
  assert.equal(voice.mode,'human-only');
  assert.deepEqual(voice.providers,['local-audio']);
});

test('release policy is human-only while migration keeps current app audible until recordings are complete',()=>{
  assert.equal(HUMAN_VOICE_POLICY.releaseMode,'human-only');
  assert.equal(HUMAN_VOICE_POLICY.runtimeMode,'migration');
  assert.equal(HUMAN_VOICE_POLICY.requireCompleteHumanCoverageForRelease,true);
});

test('recording inventory covers Yasser Khaled and games and exposes a strict release gate',async()=>{
  const tool=await read('tools/build-human-voice-corpus.mjs');
  const pkg=JSON.parse(await read('package.json'));
  assert.match(tool,/for\(let table=1;table<=10;table\+\+\)/);
  assert.match(tool,/KHALED_SKILLS/);
  assert.match(tool,/createAdvancedKhaledRound/);
  assert.match(tool,/games\.rps\.turn\.yasser/);
  assert.match(tool,/games:xo/);
  assert.match(tool,/--strict/);
  assert.equal(pkg.scripts['voice:inventory'],'node tools/build-human-voice-corpus.mjs');
  assert.equal(pkg.scripts['voice:release-check'],'node tools/build-human-voice-corpus.mjs --strict');
});
