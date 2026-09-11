import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_API_PRODUCTION_BASE,getFamilyApiBase,getGameApiBase } from '../src/shared/config/family-api-config.js';

function restoreGlobal(name,had,value){
  if(had)globalThis[name]=value;
  else delete globalThis[name];
}

test('web preview disables family cloud sync but keeps XO game API available',()=>{
  const disabledHad=Object.prototype.hasOwnProperty.call(globalThis,'__FAMILY_API_DISABLED__');
  const disabledValue=globalThis.__FAMILY_API_DISABLED__;
  const baseHad=Object.prototype.hasOwnProperty.call(globalThis,'__FAMILY_API_BASE_URL__');
  const baseValue=globalThis.__FAMILY_API_BASE_URL__;
  try{
    delete globalThis.__FAMILY_API_BASE_URL__;
    globalThis.__FAMILY_API_DISABLED__=true;
    const previewLocation={protocol:'https:',hostname:'family-learning-preview.modynawe.workers.dev'};
    assert.equal(getFamilyApiBase(null,previewLocation),'');
    assert.equal(getGameApiBase(null,previewLocation),FAMILY_API_PRODUCTION_BASE);

    globalThis.__FAMILY_API_DISABLED__=false;
    assert.equal(getFamilyApiBase(null,{protocol:'https:',hostname:'example.com'}),FAMILY_API_PRODUCTION_BASE);
    assert.equal(getGameApiBase(null,{protocol:'https:',hostname:'example.com'}),FAMILY_API_PRODUCTION_BASE);
  }finally{
    restoreGlobal('__FAMILY_API_DISABLED__',disabledHad,disabledValue);
    restoreGlobal('__FAMILY_API_BASE_URL__',baseHad,baseValue);
  }
});
