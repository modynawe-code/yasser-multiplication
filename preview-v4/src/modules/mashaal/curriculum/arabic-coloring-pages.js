const ROOT='./assets/oer/openmoji/coloring';

export const MASHAAL_ARABIC_COLORING_PAGES=Object.freeze([
  Object.freeze({id:'alif-rabbit',letterId:'alif',letter:'ا',letterName:'ألف',word:'أرنب',image:`${ROOT}/rabbit.svg`}),
  Object.freeze({id:'ba-duck',letterId:'ba',letter:'ب',letterName:'باء',word:'بطة',image:`${ROOT}/duck.svg`}),
  Object.freeze({id:'ta-crocodile',letterId:'ta',letter:'ت',letterName:'تاء',word:'تمساح',image:`${ROOT}/crocodile.svg`}),
  Object.freeze({id:'tha-fox',letterId:'tha',letter:'ث',letterName:'ثاء',word:'ثعلب',image:`${ROOT}/fox.svg`}),
  Object.freeze({id:'jim-camel',letterId:'jim',letter:'ج',letterName:'جيم',word:'جمل',image:`${ROOT}/camel.svg`})
]);

export const MASHAAL_ARABIC_COLORING_SOURCE=Object.freeze({
  title:'OpenMoji',
  license:'CC BY-SA 4.0',
  sourceUrl:'https://github.com/hfg-gmuend/openmoji',
  licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'
});

export function getMashaalArabicColoringPage(letterId){
  return MASHAAL_ARABIC_COLORING_PAGES.find(item=>item.letterId===String(letterId||''))||null;
}

export function listMashaalArabicColoringAssets(){
  return MASHAAL_ARABIC_COLORING_PAGES.map(item=>item.image);
}
