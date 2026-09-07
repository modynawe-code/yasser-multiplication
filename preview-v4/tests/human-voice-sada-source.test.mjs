import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SADA_FILTER,SADA_SERVER_FILTER,SADA_SOURCE,normalizeSadaRow,rankSadaSpeakerGroups,recordingIdFromSegmentId,sadaWhereClause } from '../tools/voice/sada-source-config.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('SADA selector prefers Najdi and permits bounded Saudi dialect fallbacks',()=>{
  assert.equal(SADA_SOURCE.dataset,'m6011/sada2022');
  assert.equal(SADA_FILTER.SpeakerAge,'Adult -- بالغ');
  assert.equal(SADA_FILTER.SpeakerGender,'Male');
  assert.equal(SADA_FILTER.SpeakerDialect,'Najdi');
  assert.deepEqual([...SADA_FILTER.SpeakerDialectFallbacks],['Khaliji','Hijazi']);
  assert.equal(SADA_FILTER.Environment,'Clean -- نظيف');
  assert.deepEqual(SADA_SERVER_FILTER,{SpeakerGender:'Male'});
  const where=sadaWhereClause();
  assert.match(where,/"SpeakerGender"/);
  for(const column of ['SpeakerDialect','SpeakerAge','Environment'])assert.doesNotMatch(where,new RegExp(`"${column}"`));
  assert.doesNotMatch(where,/--/);
});

test('speaker identity is constrained to one source recording plus diarized speaker',()=>{
  assert.equal(recordingIdFromSegmentId('6k_SBA_107_0-seg_3_990-14_890'),'6k_SBA_107_0');
  const row=normalizeSadaRow({row_idx:7,row:{
    SegmentID:'6k_SBA_107_0-seg_3_990-14_890',ProcessedText:'اختبار صوت بشري',Speaker:'Speaker1متحدث',ShowName:'برنامج',
    SegmentLength:'3.2',SpeakerAge:'Adult -- بالغ',SpeakerGender:'Male',SpeakerDialect:'Najdi',Environment:'Clean -- نظيف',audio:{src:'https://example.test/audio.wav'}
  }});
  assert.equal(row.recordingId,'6k_SBA_107_0');
  assert.equal(row.durationSeconds,3.2);
});

test('ranking keeps recordings isolated and prioritizes Najdi over Saudi fallbacks',()=>{
  const row=(segmentId,speaker,duration,dialect='Najdi')=>normalizeSadaRow({row:{SegmentID:segmentId,ProcessedText:'نص',Speaker:speaker,SegmentLength:String(duration),SpeakerAge:'Adult -- بالغ',SpeakerGender:'Male',SpeakerDialect:dialect,Environment:'Clean -- نظيف',audio:{src:'https://example.test/a.wav'}}});
  const ineligible=row('recX-seg_1','Speaker1',5,'Egyptian');
  const groups=rankSadaSpeakerGroups([
    row('recA-seg_1','Speaker1',4),row('recA-seg_2','Speaker1',5),
    row('recB-seg_1','Speaker1',20,'Khaliji'),row('recB-seg_2','Speaker1',8,'Khaliji'),
    ineligible
  ]);
  assert.equal(groups.length,2);
  assert.equal(groups[0].key,'recA::Speaker1');
  assert.equal(groups[0].speakerDialect,'Najdi');
  assert.equal(groups[0].clipCount,2);
  assert.equal(groups[1].speakerDialect,'Khaliji');
});

test('SADA acquisition scans metadata only and downloads the selected bounded source',async()=>{
  const tool=await read('tools/sada-human-source.mjs');
  assert.match(tool,/datasets-server\.huggingface\.co|viewerApi/);
  assert.match(tool,/new URL\('\/rows'/);
  assert.match(tool,/start-offset/);
  assert.match(tool,/PAGE_LENGTH=100/);
  assert.match(tool,/num_rows_total/);
  assert.match(tool,/max-mb/);
  assert.match(tool,/target-minutes/);
  assert.match(tool,/MIN_ROWS_BEFORE_EARLY_SELECTION/);
  assert.doesNotMatch(tool,/\/parquet/);
  assert.doesNotMatch(tool,/load_dataset/);
});
