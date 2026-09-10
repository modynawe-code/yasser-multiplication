export const LOCAL_BACKUP_SCHEMA_VERSION=2;
export const LOCAL_BACKUP_DIRECTORY='FamilyLearning';
export const LOCAL_BACKUP_LATEST_PATH=`${LOCAL_BACKUP_DIRECTORY}/backup-latest.json`;
export const LOCAL_BACKUP_PREVIOUS_PATH=`${LOCAL_BACKUP_DIRECTORY}/backup-previous.json`;
export const LEGACY_LOCAL_BACKUP_DIRECTORY='YasserKhaledLearning';
export const LEGACY_LOCAL_BACKUP_LATEST_PATH=`${LEGACY_LOCAL_BACKUP_DIRECTORY}/backup-latest.json`;
export const LEGACY_LOCAL_BACKUP_PREVIOUS_PATH=`${LEGACY_LOCAL_BACKUP_DIRECTORY}/backup-previous.json`;

const CURRENT_BACKUP_APP='family-learning';
const LEGACY_BACKUP_APPS=new Set(['com.modynawe.yasserkhaled']);
const LEGACY_PRIMARY_KEYS=new Set(['yasser_mul_v4_preview','khaled_grade1_math_v1']);
const TRACKED_PREFIXES=Object.freeze(['family_learning:','family-learning-rewards-v1:','family-learning-game-reward-progress-v1:']);
const DOCUMENTS_DIRECTORY='DOCUMENTS';
const UTF8_ENCODING='utf8';

export function isTrackedLearningBackupKey(value){
  const key=String(value||'');
  return LEGACY_PRIMARY_KEYS.has(key)||TRACKED_PREFIXES.some(prefix=>key.startsWith(prefix));
}
function isPrimaryLearningKey(value){
  const key=String(value||'');
  return LEGACY_PRIMARY_KEYS.has(key)||key.startsWith('family_learning:');
}
function storageKeys(storage){
  const keys=new Set(LEGACY_PRIMARY_KEYS);
  const length=Number(storage?.length);
  if(Number.isInteger(length)&&length>=0&&typeof storage?.key==='function'){
    for(let index=0;index<length;index++){
      try{const key=storage.key(index);if(key!==null&&key!==undefined)keys.add(String(key));}catch{}
    }
  }
  return [...keys];
}

export function resolveNativeFilesystem(){
  try{
    const cap=globalThis.Capacitor;
    if(!cap?.isNativePlatform?.()||!cap.isPluginAvailable?.('Filesystem'))return null;
    return cap.Plugins?.Filesystem||null;
  }catch{return null;}
}

function rawValue(storage,key){
  try{return storage?.getItem?.(key)??null;}catch{return null;}
}
function hasPrimaryLearningData(storage){
  for(const key of storageKeys(storage))if(isPrimaryLearningKey(key)&&rawValue(storage,key)!==null)return true;
  return false;
}
function validStoredJson(value){
  if(typeof value!=='string'||!value.trim())return false;
  try{JSON.parse(value);return true;}catch{return false;}
}

export function buildLocalBackupSnapshot(storage,{savedAt=new Date().toISOString()}={}){
  const records={};
  for(const key of storageKeys(storage)){
    if(!isTrackedLearningBackupKey(key))continue;
    const value=rawValue(storage,key);
    if(value!==null&&validStoredJson(value))records[key]=value;
  }
  return Object.freeze({schemaVersion:LOCAL_BACKUP_SCHEMA_VERSION,app:CURRENT_BACKUP_APP,savedAt:String(savedAt),records:Object.freeze(records)});
}

export function parseLocalBackupSnapshot(value){
  try{
    const parsed=typeof value==='string'?JSON.parse(value):value;
    const version=Number(parsed?.schemaVersion),supportedVersion=version===LOCAL_BACKUP_SCHEMA_VERSION||version===1;
    const supportedApp=parsed?.app===CURRENT_BACKUP_APP||LEGACY_BACKUP_APPS.has(parsed?.app);
    if(!parsed||!supportedVersion||!supportedApp)return null;
    if(!parsed.records||typeof parsed.records!=='object'||Array.isArray(parsed.records))return null;
    const records={};
    for(const [key,raw] of Object.entries(parsed.records)){
      if(isTrackedLearningBackupKey(key)&&raw!==undefined&&validStoredJson(raw))records[key]=raw;
    }
    if(!Object.keys(records).some(isPrimaryLearningKey))return null;
    return Object.freeze({schemaVersion:version,app:String(parsed.app),savedAt:String(parsed.savedAt||''),records:Object.freeze(records)});
  }catch{return null;}
}

async function readText(filesystem,path){
  const result=await filesystem.readFile({path,directory:DOCUMENTS_DIRECTORY,encoding:UTF8_ENCODING});
  return typeof result?.data==='string'?result.data:null;
}
async function writeText(filesystem,path,data){return filesystem.writeFile({path,data,directory:DOCUMENTS_DIRECTORY,encoding:UTF8_ENCODING,recursive:true});}

export function createLocalBackupService({
  storage=globalThis.localStorage,
  filesystem=resolveNativeFilesystem(),
  now=()=>new Date().toISOString(),
  setTimer=globalThis.setTimeout?.bind(globalThis),
  clearTimer=globalThis.clearTimeout?.bind(globalThis),
  debounceMs=120
}={}){
  let timer=null;
  let writeChain=Promise.resolve(false);

  async function ensureDirectory(){
    if(!filesystem?.mkdir)return false;
    try{await filesystem.mkdir({path:LOCAL_BACKUP_DIRECTORY,directory:DOCUMENTS_DIRECTORY,recursive:true});return true;}
    catch{return true;}
  }
  async function requestPermission(){try{if(filesystem?.requestPermissions)await filesystem.requestPermissions();}catch{}}
  async function writeSnapshot(snapshot){
    if(!filesystem?.writeFile||!Object.keys(snapshot.records).length)return false;
    const serialized=JSON.stringify(snapshot);
    const operation=async()=>{
      await ensureDirectory();
      try{
        const current=await readText(filesystem,LOCAL_BACKUP_LATEST_PATH);
        if(parseLocalBackupSnapshot(current))await writeText(filesystem,LOCAL_BACKUP_PREVIOUS_PATH,current);
      }catch{}
      await writeText(filesystem,LOCAL_BACKUP_LATEST_PATH,serialized);
      return true;
    };
    try{return await operation();}
    catch{await requestPermission();try{return await operation();}catch{return false;}}
  }
  function queueBackup(){
    if(!filesystem?.writeFile||typeof setTimer!=='function')return false;
    if(timer!==null&&typeof clearTimer==='function')clearTimer(timer);
    timer=setTimer(()=>{timer=null;void flush();},Math.max(0,Number(debounceMs)||0));
    return true;
  }
  function flush(){
    if(timer!==null&&typeof clearTimer==='function'){clearTimer(timer);timer=null;}
    const snapshot=buildLocalBackupSnapshot(storage,{savedAt:now()});
    writeChain=writeChain.then(()=>writeSnapshot(snapshot),()=>writeSnapshot(snapshot));
    return writeChain;
  }
  async function readBackupCandidate(path){
    if(!filesystem?.readFile)return null;
    try{return parseLocalBackupSnapshot(await readText(filesystem,path));}
    catch{await requestPermission();try{return parseLocalBackupSnapshot(await readText(filesystem,path));}catch{return null;}}
  }
  async function restoreIfFresh(){
    if(hasPrimaryLearningData(storage))return Object.freeze({restored:false,reason:'local-data-present'});
    if(!filesystem?.readFile)return Object.freeze({restored:false,reason:'native-filesystem-unavailable'});
    const paths=[LOCAL_BACKUP_LATEST_PATH,LOCAL_BACKUP_PREVIOUS_PATH,LEGACY_LOCAL_BACKUP_LATEST_PATH,LEGACY_LOCAL_BACKUP_PREVIOUS_PATH];
    for(const path of paths){
      const snapshot=await readBackupCandidate(path);if(!snapshot)continue;
      let restored=0;
      for(const [key,value] of Object.entries(snapshot.records)){
        if(!isTrackedLearningBackupKey(key))continue;
        try{storage?.setItem?.(key,value);restored++;}catch{}
      }
      if(restored)return Object.freeze({restored:true,reason:'external-backup',path,records:restored,savedAt:snapshot.savedAt});
    }
    return Object.freeze({restored:false,reason:'backup-not-found'});
  }

  const backupAwareStorage=Object.freeze({
    get length(){try{return Number(storage?.length)||0;}catch{return 0;}},
    key:index=>{try{return storage?.key?.(index)??null;}catch{return null;}},
    getItem:key=>rawValue(storage,key),
    setItem(key,value){storage?.setItem?.(key,value);if(isTrackedLearningBackupKey(key))queueBackup();},
    removeItem(key){storage?.removeItem?.(key);if(isTrackedLearningBackupKey(key))queueBackup();}
  });

  return Object.freeze({
    storage:backupAwareStorage,queueBackup,flush,restoreIfFresh,
    isAvailable:()=>Boolean(filesystem?.readFile&&filesystem?.writeFile),
    latestPath:LOCAL_BACKUP_LATEST_PATH,previousPath:LOCAL_BACKUP_PREVIOUS_PATH
  });
}
