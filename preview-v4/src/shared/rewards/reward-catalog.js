export const REWARD_CATALOG=Object.freeze([
  Object.freeze({id:'mastery-cup',label:'كأس الإتقان',graphicKey:'mastery-cup',scope:'mastery',importance:'major'}),
  Object.freeze({id:'weekly-cup',label:'كأس الأسبوع',graphicKey:'weekly-cup',scope:'weekly',importance:'major'}),
  Object.freeze({id:'accuracy-medal',label:'وسام الدقة',graphicKey:'accuracy-medal',scope:'accuracy',importance:'medium'}),
  Object.freeze({id:'mastery-shield',label:'درع الإتقان',graphicKey:'mastery-shield',scope:'skill',importance:'medium'}),
  Object.freeze({id:'distinction-crown',label:'تاج التميّز',graphicKey:'distinction-crown',scope:'expertise',importance:'major'}),
  Object.freeze({id:'streak-flame',label:'شعلة الاستمرار',graphicKey:'streak-flame',scope:'streak',importance:'medium'}),
  Object.freeze({id:'surprise-box',label:'صندوق المفاجآت',graphicKey:'surprise-box',scope:'milestone',importance:'major'}),
  Object.freeze({id:'progress-badge',label:'شارة التقدّم',graphicKey:'progress-badge',scope:'improvement',importance:'medium'})
]);

export const REWARD_BY_ID=Object.freeze(Object.fromEntries(REWARD_CATALOG.map(item=>[item.id,item])));
