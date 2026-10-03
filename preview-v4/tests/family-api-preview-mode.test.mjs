import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_API_PRODUCTION_BASE,getFamilyApiBase } from '../src/shared/config/family-api-config.js';

function restoreGlobal(name,had,value){
  if(had)globalThis[name]=value;
  else delete globalThis[name];
}

test('web preview can explicitly disable family cloud access without changing production fallback',()=>{
  const disabledHad=Object.prototype.hasOwnProperty.call(globalThis,'__FAMILY_API_DISABLED__');
  const disabledValue=globalThis.__FAMILY_API_DISABLED__;
  const baseHad=Object.prototype.hasOwnProperty.call(globalThis,'__FAMILY_API_BASE_URL__');
  const baseValue=globalThis.__FAMILY_API_BASE_URL__;
  try{
    delete globalThis.__FAMILY_API_BASE_URL__;
    globalThis.__FAMILY_API_DISABLED__=true;
    assert.equal(getFamilyApiBase(null,{protocol:'https:',hostname:'family-learning-preview.modynawe.workers.dev'}),'');

    globalThis.__FAMILY_API_DISABLED__=false;
    assert.equal(getFamilyApiBase(null,{protocol:'https:',hostname:'example.com'}),FAMILY_API_PRODUCTION_BASE);
  }finally{
    restoreGlobal('__FAMILY_API_DISABLED__',disabledHad,disabledValue);
    restoreGlobal('__FAMILY_API_BASE_URL__',baseHad,baseValue);
  }
});
