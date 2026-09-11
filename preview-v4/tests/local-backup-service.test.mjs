import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LOCAL_BACKUP_DIRECTORY,
  LOCAL_BACKUP_LATEST_PATH,
  LOCAL_BACKUP_PREVIOUS_PATH,
  LEGACY_LOCAL_BACKUP_LATEST_PATH,
  buildLocalBackupSnapshot,
  createLocalBackupService,
  isTrackedLearningBackupKey,
  parseLocalBackupSnapshot
} from '../src/shared/backup/local-backup-service.js';

function memoryStorage(initial={}){
  const map=new Map(Object.entries(initial));
  return{
    get length(){return map.size;},
    key:index=>[...map.keys()][index]??null,
    getItem:key=>map.has(String(key))?map.get(String(key)):null,
    setItem:(key,value)=>map.set(String(key),String(value)),
    removeItem:key=>map.delete(String(key)),
    dump:()=>Object.fromEntries(map)
  };
}

function memoryFilesystem(initial={}){
  const files=new Map(Object.entries(initial));
  return{
    files,
    async mkdir(){return{};},
    async requestPermissions(){return{publicStorage:'granted'};},
    async readFile({path}){if(!files.has(path))throw new Error('missing');return{data:files.get(path)};},
    async writeFile({path,data}){files.set(path,String(data));return{uri:`memory://${path}`};}
  };
}

test('backup snapshot contains learning progress and rewards but not unrelated local values',()=>{
  const storage=memoryStorage({
    yasser_mul_v4_preview:JSON.stringify({attemptLog:[{attemptId:'y1'}]}),
    khaled_grade1_math_v1:JSON.stringify({attemptLog:[{attemptId:'k1'}]}),
    'family-learning-rewards-v1:yasser':JSON.stringify({learnerId:'yasser',unlocks:[]}),
    family_api_token:'secret-value'
  });
  const snapshot=buildLocalBackupSnapshot(storage,{savedAt:'2026-09-08T05:00:00Z'});
  assert.equal(Object.keys(snapshot.records).length,3);
  assert.equal(snapshot.records.family_api_token,undefined);
  assert.equal(snapshot.app,'family-learning');
  assert.ok(parseLocalBackupSnapshot(JSON.stringify(snapshot)));
});

test('future learner state and rewards are backed up by namespace without editing a fixed key list',()=>{
  const storage=memoryStorage({
    'family_learning:future-child':JSON.stringify({learnerId:'future-child',evidence:[]}),
    'family-learning-rewards-v1:future-child':JSON.stringify({learnerId:'future-child',unlocks:[]}),
    'unrelated:future-child':JSON.stringify({secret:true})
  });
  const snapshot=buildLocalBackupSnapshot(storage);
  assert.equal(isTrackedLearningBackupKey('family_learning:future-child'),true);
  assert.equal(isTrackedLearningBackupKey('family-learning-rewards-v1:future-child'),true);
  assert.equal(isTrackedLearningBackupKey('unrelated:future-child'),false);
  assert.ok(snapshot.records['family_learning:future-child']);
  assert.ok(snapshot.records['family-learning-rewards-v1:future-child']);
  assert.equal(snapshot.records['unrelated:future-child'],undefined);
});

test('backup-aware storage writes a durable latest snapshot and keeps one previous generation',async()=>{
  const storage=memoryStorage({yasser_mul_v4_preview:JSON.stringify({version:1})});
  const filesystem=memoryFilesystem();
  const service=createLocalBackupService({storage,filesystem,now:()=> '2026-09-08T05:00:00Z',setTimer:()=>0,clearTimer:()=>{},debounceMs:0});
  assert.equal(LOCAL_BACKUP_DIRECTORY,'FamilyLearning');
  assert.equal(await service.flush(),true);
  const first=filesystem.files.get(LOCAL_BACKUP_LATEST_PATH);
  assert.ok(parseLocalBackupSnapshot(first));

  service.storage.setItem('yasser_mul_v4_preview',JSON.stringify({version:2}));
  assert.equal(await service.flush(),true);
  assert.equal(filesystem.files.get(LOCAL_BACKUP_PREVIOUS_PATH),first);
  const latest=parseLocalBackupSnapshot(filesystem.files.get(LOCAL_BACKUP_LATEST_PATH));
  assert.deepEqual(JSON.parse(latest.records.yasser_mul_v4_preview),{version:2});
});

test('fresh install restores progress and reward ledger from family backup before repositories load',async()=>{
  const source=memoryStorage({
    yasser_mul_v4_preview:JSON.stringify({attemptLog:[{attemptId:'restored-y'}]}),
    khaled_grade1_math_v1:JSON.stringify({attemptLog:[{attemptId:'restored-k'}]}),
    'family_learning:mashaal':JSON.stringify({learnerId:'mashaal',evidence:[{evidenceId:'m1'}]}),
    'family-learning-rewards-v1:khaled':JSON.stringify({learnerId:'khaled',unlocks:[{rewardId:'mastery-shield'}]})
  });
  const snapshot=buildLocalBackupSnapshot(source,{savedAt:'2026-09-08T05:10:00Z'});
  const filesystem=memoryFilesystem({[LOCAL_BACKUP_LATEST_PATH]:JSON.stringify(snapshot)});
  const target=memoryStorage();
  const service=createLocalBackupService({storage:target,filesystem});
  const result=await service.restoreIfFresh();
  assert.equal(result.restored,true);
  assert.match(target.getItem('yasser_mul_v4_preview'),/restored-y/);
  assert.match(target.getItem('khaled_grade1_math_v1'),/restored-k/);
  assert.match(target.getItem('family_learning:mashaal'),/m1/);
  assert.match(target.getItem('family-learning-rewards-v1:khaled'),/mastery-shield/);
});

test('schema-v1 YasserKhaledLearning backup remains restorable after family namespace migration',async()=>{
  const legacySnapshot={
    schemaVersion:1,
    app:'com.modynawe.yasserkhaled',
    savedAt:'2026-09-07T20:00:00Z',
    records:{
      yasser_mul_v4_preview:JSON.stringify({marker:'legacy-y'}),
      khaled_grade1_math_v1:JSON.stringify({marker:'legacy-k'}),
      'family-learning-rewards-v1:yasser':JSON.stringify({learnerId:'yasser',unlocks:[]})
    }
  };
  const filesystem=memoryFilesystem({[LEGACY_LOCAL_BACKUP_LATEST_PATH]:JSON.stringify(legacySnapshot)});
  const target=memoryStorage();
  const result=await createLocalBackupService({storage:target,filesystem}).restoreIfFresh();
  assert.equal(result.restored,true);
  assert.equal(result.path,LEGACY_LOCAL_BACKUP_LATEST_PATH);
  assert.match(target.getItem('yasser_mul_v4_preview'),/legacy-y/);
  assert.match(target.getItem('khaled_grade1_math_v1'),/legacy-k/);
});

test('restore never overwrites existing local learning progress',async()=>{
  const external=buildLocalBackupSnapshot(memoryStorage({yasser_mul_v4_preview:JSON.stringify({marker:'external'})}));
  const filesystem=memoryFilesystem({[LOCAL_BACKUP_LATEST_PATH]:JSON.stringify(external)});
  const target=memoryStorage({yasser_mul_v4_preview:JSON.stringify({marker:'local'})});
  const result=await createLocalBackupService({storage:target,filesystem}).restoreIfFresh();
  assert.equal(result.restored,false);
  assert.equal(result.reason,'local-data-present');
  assert.match(target.getItem('yasser_mul_v4_preview'),/local/);
});

test('restore falls back to previous generation when latest backup is invalid',async()=>{
  const previous=buildLocalBackupSnapshot(memoryStorage({khaled_grade1_math_v1:JSON.stringify({marker:'previous'})}));
  const filesystem=memoryFilesystem({
    [LOCAL_BACKUP_LATEST_PATH]:'{broken',
    [LOCAL_BACKUP_PREVIOUS_PATH]:JSON.stringify(previous)
  });
  const target=memoryStorage();
  const result=await createLocalBackupService({storage:target,filesystem}).restoreIfFresh();
  assert.equal(result.restored,true);
  assert.equal(result.path,LOCAL_BACKUP_PREVIOUS_PATH);
  assert.match(target.getItem('khaled_grade1_math_v1'),/previous/);
});

test('mobile composition wires backup before learning repositories and ships Filesystem plugin',async()=>{
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  const rootPackage=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));
  assert.match(main,/createLocalBackupService/);
  assert.match(main,/await localBackup\.restoreIfFresh\(\)/);
  assert.match(main,/createLocalStorageRepository\(localBackup\.storage\)/);
  assert.match(main,/createKhaledRepository\(localBackup\.storage\)/);
  assert.match(main,/createMashaalLocalStorageRepository\(localBackup\.storage\)/);
  assert.match(main,/createRewardRepository\(\{storage:localBackup\.storage\}\)/);
  assert.match(worker,/src\/shared\/backup\/local-backup-service\.js/);
  assert.equal(rootPackage.dependencies['@capacitor/filesystem'],'8.1.3');
});
