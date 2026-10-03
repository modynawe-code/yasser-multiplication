const SAMA_ROOT='https://www.sama.gov.sa/ar-sa/Currency/PublishingImages/';

export const SAUDI_MONEY_ASSETS=Object.freeze({
  1:Object.freeze({
    value:1,
    kind:'coin',
    label:'ريال واحد',
    sources:Object.freeze([
      `${SAMA_ROOT}one-Riyal-N.png`
    ])
  }),
  2:Object.freeze({
    value:2,
    kind:'coin',
    label:'ريالان',
    sources:Object.freeze([
      `${SAMA_ROOT}Two-Riyals-N.png`
    ])
  }),
  5:Object.freeze({
    value:5,
    kind:'note',
    label:'خمسة ريالات',
    sources:Object.freeze([
      `${SAMA_ROOT}Sixth%20Issue%205%20Riyal%20Note.png`,
      `${SAMA_ROOT}Sixth%20Issue%205%20Riyal%20Polymer%20Note.png`
    ])
  }),
  10:Object.freeze({
    value:10,
    kind:'note',
    label:'عشرة ريالات',
    sources:Object.freeze([
      `${SAMA_ROOT}Sixth%20Issue%2010%20Riyal%20Note.png`
    ])
  })
});

export const SAUDI_MONEY_REMOTE_URLS=Object.freeze(
  [...new Set(Object.values(SAUDI_MONEY_ASSETS).flatMap(asset=>asset.sources))]
);

export function getSaudiMoneyAsset(value){
  const asset=SAUDI_MONEY_ASSETS[Number(value)];
  if(!asset)throw new Error(`Unsupported Saudi money denomination: ${value}`);
  return asset;
}

function showFallback(image){
  image.hidden=true;
  const fallback=image.parentElement?.querySelector('.khaled-money-fallback');
  if(fallback)fallback.hidden=false;
}

export function hydrateSaudiMoneyImages(root){
  if(!root)return;
  root.querySelectorAll('img[data-saudi-money-value]').forEach(image=>{
    if(image.dataset.moneyHydrated==='true')return;
    image.dataset.moneyHydrated='true';
    const asset=getSaudiMoneyAsset(image.dataset.saudiMoneyValue);
    let sourceIndex=0;
    const loadNext=()=>{
      if(sourceIndex>=asset.sources.length){showFallback(image);return;}
      image.src=asset.sources[sourceIndex++];
    };
    image.addEventListener('error',loadNext);
    image.addEventListener('load',()=>{
      image.hidden=false;
      const fallback=image.parentElement?.querySelector('.khaled-money-fallback');
      if(fallback)fallback.hidden=true;
    });
    loadNext();
  });
}
