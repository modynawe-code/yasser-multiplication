const freezeReward=item=>Object.freeze({...item,rewardIds:Object.freeze([...item.rewardIds])});
const reward=(id,rewardIds,label,kind,hint,unlockCount=2,tier='rare')=>freezeReward({
  id,
  rewardIds,
  label,
  graphicKey:id,
  kind,
  hint,
  tier,
  category:'collection',
  unlockCount
});

export const UPLOADED_REWARD_COLLECTION=Object.freeze([
  reward('shared-emerald-cube',['progress-badge'],'مكعب الزمرد','cube','واصل التقدّم لفتح مكعب الزمرد.',2,'rare'),
  reward('shared-neon-lockbox',['surprise-box'],'صندوق الغموض','chest','أنجز محطات تدريب إضافية لفتح صندوق الغموض.',4,'epic'),
  reward('shared-magic-book',['accuracy-medal'],'كتاب السحر','badge','كرر إنجازات الدقة لفتح كتاب السحر.',2,'rare'),
  reward('shared-energy-cube',['mastery-shield'],'مكعب الطاقة','cube','أتقن مهارات جديدة لفتح مكعب الطاقة.',2,'rare'),
  reward('shared-angel-wings',['weekly-cup','distinction-crown'],'أجنحة النور','boost','حقق إنجازات أسبوعية قوية لفتح أجنحة النور.',2,'legendary'),
  reward('shared-golden-apple',['progress-badge'],'التفاحة الذهبية','badge','استمر في رفع مستواك لفتح التفاحة الذهبية.',3,'epic'),
  reward('shared-crystal-bow',['accuracy-medal'],'قوس الكريستال','sword','حافظ على الدقة عبر عدة إنجازات لفتح قوس الكريستال.',3,'epic'),
  reward('shared-ice-trident',['mastery-cup'],'رمح الجليد','sword','كرر إنجازات الإتقان لفتح رمح الجليد.',2,'epic'),
  reward('shared-ice-pickaxe',['mastery-shield'],'معول الجليد','sword','أتقن مزيدًا من المهارات لفتح معول الجليد.',3,'epic'),
  reward('shared-ice-axe',['mastery-cup'],'فأس الجليد','sword','واصل الإتقان لفتح فأس الجليد.',3,'legendary'),
  reward('shared-royal-chest',['surprise-box'],'صندوق الأبطال','chest','أنجز محطات تدريب متقدمة لفتح صندوق الأبطال.',5,'legendary'),
  reward('shared-lightning-racer',['streak-flame'],'سيارة البرق','car','حافظ على سلسلة تعلم قوية لفتح سيارة البرق.',2,'epic'),
  reward('shared-diamond-shield',['mastery-shield'],'درع الألماس','shield','اجمع إنجازات إتقان إضافية لفتح درع الألماس.',4,'legendary'),
  reward('shared-crystal-sword',['mastery-cup'],'سيف الكريستال','sword','واصل الإتقان لفتح سيف الكريستال.',4,'legendary'),
  reward('shared-prism-cube',['progress-badge'],'مكعب الجواهر','cube','حقق تقدّمًا متكررًا لفتح مكعب الجواهر.',4,'legendary'),
  reward('shared-rocket-racer',['streak-flame'],'السيارة الصاروخية','car','حافظ على سلسلة تعلم أطول لفتح السيارة الصاروخية.',3,'legendary'),
  reward('shared-gold-blue-chest',['surprise-box'],'صندوق الذهب','chest','استمر في الإنجاز لفتح صندوق الذهب.',6,'legendary'),
  reward('shared-neon-wheels',['weekly-cup','distinction-crown'],'عجلات النيون','wheel','حقق إنجازات أسبوعية متقدمة لفتح عجلات النيون.',3,'legendary')
]);

export const UPLOADED_REWARD_ASSET_KEYS=Object.freeze(UPLOADED_REWARD_COLLECTION.map(item=>item.graphicKey));

export const UPLOADED_REWARD_VISUALS=Object.freeze({
  'shared-emerald-cube':{kind:'cube',a:'#38e56e',b:'#057336',accent:'#d9ffe5'},
  'shared-neon-lockbox':{kind:'chest',a:'#19d9c7',b:'#16284c',accent:'#c33cff'},
  'shared-magic-book':{kind:'badge',a:'#7d3cff',b:'#36148c',accent:'#42e9ff'},
  'shared-energy-cube':{kind:'cube',a:'#36d8ff',b:'#0754c9',accent:'#e7fbff'},
  'shared-angel-wings':{kind:'boost',a:'#dfe9ff',b:'#7588b5',accent:'#b9e8ff'},
  'shared-golden-apple':{kind:'badge',a:'#ffd537',b:'#d36b00',accent:'#fff5a3'},
  'shared-crystal-bow':{kind:'sword',a:'#b855ff',b:'#39208f',accent:'#67eaff'},
  'shared-ice-trident':{kind:'sword',a:'#48dcff',b:'#0a57ba',accent:'#ffd75a'},
  'shared-ice-pickaxe':{kind:'sword',a:'#39d8ff',b:'#0a4dac',accent:'#edfaff'},
  'shared-ice-axe':{kind:'sword',a:'#42d6ff',b:'#074fa9',accent:'#e9fbff'},
  'shared-royal-chest':{kind:'chest',a:'#247bff',b:'#153287',accent:'#ffd65a'},
  'shared-lightning-racer':{kind:'car',a:'#ffd12d',b:'#16171d',accent:'#fff2a0'},
  'shared-diamond-shield':{kind:'shield',a:'#248fff',b:'#0750c4',accent:'#ffd44d'},
  'shared-crystal-sword':{kind:'sword',a:'#49ddff',b:'#1867da',accent:'#c448ff'},
  'shared-prism-cube':{kind:'cube',a:'#54e8ff',b:'#8c4ff2',accent:'#ff99eb'},
  'shared-rocket-racer':{kind:'car',a:'#1e83ff',b:'#f27b17',accent:'#e8f7ff'},
  'shared-gold-blue-chest':{kind:'chest',a:'#1979ff',b:'#0d42ad',accent:'#ffd33c'},
  'shared-neon-wheels':{kind:'wheel',a:'#28cfff',b:'#6a27bf',accent:'#fb5dff'}
});
