const reward=(id,label,graphicKey,scope,importance='medium')=>Object.freeze({id,label,graphicKey,scope,importance,theme:'mashaal'});

export const MASHAAL_REWARD_CATALOG=Object.freeze([
  reward('mashaal-attempt-flower','زهرة المحاولة','mashaal.reward.attempt-flower','participation'),
  reward('mashaal-progress-butterfly','فراشة التقدّم','mashaal.reward.progress-butterfly','progress'),
  reward('mashaal-consistency-star','نجمة الاستمرار','mashaal.reward.consistency-star','consistency'),
  reward('mashaal-cooperation-heart','قلب التعاون','mashaal.reward.cooperation-heart','social'),
  reward('mashaal-distinction-crown','تاج التميّز','mashaal.reward.distinction-crown','milestone','major'),
  reward('mashaal-achievement-ribbon','شريطة الإنجاز','mashaal.reward.achievement-ribbon','completion'),
  reward('mashaal-persistence-pearl','لؤلؤة المثابرة','mashaal.reward.persistence-pearl','persistence'),
  reward('mashaal-variety-rainbow','قوس قزح','mashaal.reward.variety-rainbow','variety','major'),
  reward('mashaal-surprise-box','صندوق المفاجآت','mashaal.reward.surprise-box','milestone','major'),
  reward('mashaal-cup','كأس مشاعل','mashaal.reward.cup','milestone','major'),
  reward('mashaal-courage-star','نجمة الشجاعة','mashaal.reward.courage-star','exploration'),
  reward('mashaal-magic-wand','عصا الإنجاز','mashaal.reward.magic-wand','milestone','major')
]);

export const MASHAAL_REWARD_CATALOG_ID='mashaal-developmental';
