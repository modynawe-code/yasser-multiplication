export const MASHAAL_TREASURE_THEME=Object.freeze({
  id:'mashaal-treasure-garden-v1',
  title:'كنوز مشاعل',
  eyebrow:'كل محاولة لها قيمة',
  openCta:'شوفي جوائزك',
  collectionAria:'مجموعة كنوز مشاعل',
  featureAria:'آخر جائزة',
  states:Object.freeze({locked:'ينتظرك',unlocked:'مفتوح',new:'جديد'}),
  feature:Object.freeze({
    firstLabel:'أول كنز ينتظرك',
    firstBody:'ابدئي اللعب، وكل محاولة وإنجاز ممكن يفتح لك كنزًا.',
    latestLabel:'آخر كنز فتحتيه',
    latestNewLabel:'كنز جديد لك',
    latestBody:'محفوظ في كنوزك، ويفتح مع إنجاز حقيقي.'
  }),
  scopeCopy:Object.freeze({
    participation:'للمشاركة والمحاولة',
    progress:'للتقدّم خطوة بعد خطوة',
    consistency:'للاستمرار الجميل',
    social:'للتعاون واللطف',
    milestone:'لإنجاز كبير',
    completion:'لإكمال النشاط',
    persistence:'للمثابرة وإعادة المحاولة',
    variety:'لتجربة أنشطة متنوعة',
    exploration:'لخوض تجربة جديدة'
  })
});

export function mashaalRewardStateLabel({unlocked=false,isNew=false}={}){
  if(isNew)return MASHAAL_TREASURE_THEME.states.new;
  return unlocked?MASHAAL_TREASURE_THEME.states.unlocked:MASHAAL_TREASURE_THEME.states.locked;
}

export function mashaalRewardScopeCopy(scope){
  return MASHAAL_TREASURE_THEME.scopeCopy[scope]||'لإنجاز جميل';
}
