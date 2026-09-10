const DEFAULT_CONTRACT=Object.freeze({
  role:'illustration',
  fit:'contain',
  position:'50% 50%',
  semanticFocus:'whole-subject',
  renderMode:'media',
  cropScale:1
});

const actionCrop=(semanticFocus,position='84% 50%',cropScale=1.18)=>Object.freeze({
  role:'action-scene',fit:'cover',position,semanticFocus,renderMode:'media',cropScale
});

const wholeScene=(semanticFocus)=>Object.freeze({
  role:'scene',fit:'contain',position:'50% 50%',semanticFocus,renderMode:'media',cropScale:1
});

const exactObject=(semanticFocus)=>Object.freeze({
  role:'isolated-object',fit:'contain',position:'50% 50%',semanticFocus,renderMode:'media',cropScale:1
});

const vectorScene=(semanticFocus)=>Object.freeze({
  role:'semantic-scene',fit:'contain',position:'50% 50%',semanticFocus,renderMode:'vector',cropScale:1
});

const CONTRACTS=Object.freeze({
  duck:exactObject('duck'),apple:exactObject('apple'),moon:exactObject('moon'),ball:exactObject('ball'),
  'compare-three-apples':exactObject('three-apples'),'compare-four-apples':exactObject('four-apples'),'compare-five-apples':exactObject('five-apples'),
  'saudi-flag':exactObject('saudi-flag'),'japan-flag':exactObject('japan-flag'),'brazil-flag':exactObject('brazil-flag'),
  doctor:wholeScene('doctor-at-work'),teacher:wholeScene('teacher-at-work'),baker:wholeScene('baker-at-work'),
  'girl-drinking-water':vectorScene('child-drinking-water'),'girl-lost-toy':wholeScene('lost-toy-emotion'),'rainy-day':wholeScene('rain-context'),
  happy:wholeScene('happy-face'),sad:wholeScene('sad-face'),angry:wholeScene('angry-face'),
  umbrella:exactObject('umbrella'),sunglasses:exactObject('sunglasses'),
  'wait-turn':actionCrop('waiting-for-turn','86% 50%',1.2),'grab-ball':actionCrop('taking-ball','88% 50%',1.2),'walk-away-angry':actionCrop('walking-away-angry','88% 50%',1.2),
  'ask-help':actionCrop('asking-for-help','88% 50%',1.2),'throw-blocks':actionCrop('throwing-blocks','88% 50%',1.2),'kick-blocks':actionCrop('kicking-blocks','88% 50%',1.2),
  'wet-hands':actionCrop('hands-under-water','96% 54%',1.34),'soap':actionCrop('soap-on-hands','96% 54%',1.34),'rub-hands':actionCrop('rubbing-hands','96% 54%',1.34),'rinse-hands':actionCrop('rinsing-hands','96% 54%',1.34),
  'stay-away':actionCrop('safe-distance-from-hot-surface','96% 52%',1.3),'touch-hot':actionCrop('touching-hot-surface','96% 52%',1.3),'play-near-hot':actionCrop('playing-near-hot-surface','96% 52%',1.3),
  'return-book':actionCrop('returning-book','90% 52%',1.24),'leave-book-floor':actionCrop('book-left-on-floor','90% 52%',1.24),'damage-book':actionCrop('damaging-book','90% 52%',1.24),
  'help-tidy':actionCrop('helping-tidy','96% 52%',1.33),'leave-mess':actionCrop('leaving-mess','96% 52%',1.33),'scatter-toys':actionCrop('scattering-toys','96% 52%',1.33),
  wake:vectorScene('wake-up'),'brush-teeth':vectorScene('brushing-teeth'),breakfast:vectorScene('eating-breakfast'),
  'ball-above-box':exactObject('ball-above-box'),'ball-inside-box':exactObject('ball-inside-box'),'ball-below-box':exactObject('ball-below-box'),
  balance:Object.freeze({role:'guided-action',fit:'contain',position:'50% 50%',semanticFocus:'balance-one-foot',renderMode:'vector',cropScale:1}),
  'fine-motor':Object.freeze({role:'guided-action',fit:'contain',position:'50% 50%',semanticFocus:'transfer-three-safe-pieces',renderMode:'vector',cropScale:1})
});

export function getMashaalAssetContract(key){
  return CONTRACTS[String(key)]||DEFAULT_CONTRACT;
}

export function listMashaalAssetContractKeys(){return Object.keys(CONTRACTS);}
