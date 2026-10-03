const criterion=(metric,label,target)=>Object.freeze({metric,label,target});
const requirement=(...criteria)=>Object.freeze({criteria:Object.freeze(criteria)});
const reward=(id,label,graphicKey,scope,{importance='medium',tier='basic',assetPath=null,criteria=[]}={})=>Object.freeze({
  id,label,graphicKey,scope,importance,tier,assetPath,visible:true,theme:'mashaal',
  requirements:requirement(...criteria)
});

const c=criterion;

export const MASHAAL_REWARD_CATALOG=Object.freeze([
  reward('mashaal-attempt-flower','زهرة المحاولة','mashaal.reward.attempt-flower','participation',{criteria:[c('completions','أكملي جولة واحدة',1)]}),
  reward('mashaal-progress-butterfly','فراشة التقدّم','mashaal.reward.progress-butterfly','progress',{criteria:[c('completions','أكملي 3 جولات',3)]}),
  reward('mashaal-consistency-star','نجمة الاستمرار','mashaal.reward.consistency-star','consistency',{criteria:[c('completions','أكملي 4 جولات',4)]}),
  reward('mashaal-cooperation-heart','قلب التعاون','mashaal.reward.cooperation-heart','social',{criteria:[c('cooperations','أكملي نشاط تعاون واحد',1)]}),
  reward('mashaal-distinction-crown','تاج التميّز','mashaal.reward.distinction-crown','milestone',{importance:'major',criteria:[c('wins','فوزي بجولتين',2)]}),
  reward('mashaal-achievement-ribbon','شريطة الإنجاز','mashaal.reward.achievement-ribbon','completion',{criteria:[c('goals','حققي هدفًا واحدًا',1)]}),
  reward('mashaal-persistence-pearl','لؤلؤة المثابرة','mashaal.reward.persistence-pearl','persistence',{criteria:[c('retries','حاولي مرة ثانية بعد خطأ',1)]}),
  reward('mashaal-variety-rainbow','قوس قزح','mashaal.reward.variety-rainbow','variety',{importance:'major',criteria:[c('uniqueGamesCompleted','جرّبي لعبتين مختلفتين',2)]}),
  reward('mashaal-surprise-box','صندوق المفاجآت','mashaal.reward.surprise-box','milestone',{importance:'major',criteria:[c('completions','أكملي 5 جولات',5)]}),
  reward('mashaal-cup','كأس مشاعل','mashaal.reward.cup','milestone',{importance:'major',criteria:[c('completions','أكملي 10 جولات',10)]}),
  reward('mashaal-courage-star','نجمة الشجاعة','mashaal.reward.courage-star','exploration',{criteria:[c('uniqueGamesCompleted','أكملي لعبة واحدة جديدة',1)]}),
  reward('mashaal-magic-wand','عصا الإنجاز','mashaal.reward.magic-wand','milestone',{importance:'major',criteria:[c('goals','حققي 3 أهداف',3),c('retries','حاولي مرة ثانية بعد خطأ',1)]}),
  reward('mashaal-premium-shoes','حذاء الأميرة','mashaal.reward.premium.shoes','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-shoes.webp',criteria:[c('completions','أكملي 8 جولات',8)]}),
  reward('mashaal-premium-hair-bows','ربطات الأميرة','mashaal.reward.premium.hair-bows','variety',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-hair-bows.webp',criteria:[c('completions','أكملي 6 جولات',6),c('uniqueGamesCompleted','جرّبي لعبتين مختلفتين',2)]}),
  reward('mashaal-premium-mirror','مرآة الأميرة','mashaal.reward.premium.mirror','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-mirror.webp',criteria:[c('wins','فوزي في 3 جولات',3),c('retries','حاولي من جديد مرتين',2)]}),
  reward('mashaal-premium-makeup','مجموعة الزينة','mashaal.reward.premium.makeup','persistence',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-makeup.webp',criteria:[c('completions','أكملي 8 جولات',8),c('retries','حاولي من جديد 5 مرات',5)]}),
  reward('mashaal-premium-necklace','قلادة اللؤلؤ','mashaal.reward.premium.necklace','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-necklace.webp',criteria:[c('wins','فوزي في 5 جولات',5)]}),
  reward('mashaal-premium-wand','عصا الأميرة','mashaal.reward.premium.wand','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-wand.webp',criteria:[c('goals','حققي 8 أهداف',8)]}),
  reward('mashaal-premium-bracelet','سوار الأميرة','mashaal.reward.premium.bracelet','consistency',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-bracelet.webp',criteria:[c('completions','أكملي 12 جولة',12)]}),
  reward('mashaal-premium-gown','فستان الأميرة','mashaal.reward.premium.gown','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-gown.webp',criteria:[c('completions','أكملي 15 جولة',15),c('uniqueGamesCompleted','جرّبي لعبتين مختلفتين',2)]}),
  reward('mashaal-premium-crown','تاج الأميرة','mashaal.reward.premium.crown','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-crown.webp',criteria:[c('completions','أكملي 20 جولة',20),c('wins','فوزي في 5 جولات',5),c('uniqueGamesCompleted','جرّبي لعبتين مختلفتين',2)]}),
  reward('mashaal-premium-treasure-chest','صندوق كنوز الأميرة','mashaal.reward.premium.treasure-chest','milestone',{importance:'major',tier:'premium',assetPath:'assets/mashaal/rewards/premium/premium-treasure-chest.webp',criteria:[c('completions','أكملي 30 جولة',30),c('wins','فوزي في 10 جولات',10),c('goals','حققي 10 أهداف',10)]})
]);

export const MASHAAL_REWARD_CATALOG_ID='mashaal-developmental';
