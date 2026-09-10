const DEFAULT_CONTRACT=Object.freeze({
  role:'illustration',
  fit:'contain',
  position:'50% 50%',
  semanticFocus:'whole-subject',
  renderMode:'media'
});

const actionCrop=(semanticFocus,position='78% 50%')=>Object.freeze({
  role:'action-scene',fit:'cover',position,semanticFocus,renderMode:'media'
});

const wholeScene=(semanticFocus)=>Object.freeze({
  role:'scene',fit:'contain',position:'50% 50%',semanticFocus,renderMode:'media'
});

const exactObject=(semanticFocus)=>Object.freeze({
  role:'isolated-object',fit:'contain',position:'50% 50%',semanticFocus,renderMode:'media'
});

const CONTRACTS=Object.freeze({
  duck:exactObject('duck'),apple:exactObject('apple'),moon:exactObject('moon'),ball:exactObject('ball'),
  'compare-three-apples':exactObject('three-apples'),'compare-four-apples':exactObject('four-apples'),'compare-five-apples':exactObject('five-apples'),
  'saudi-flag':exactObject('saudi-flag'),'japan-flag':exactObject('japan-flag'),'brazil-flag':exactObject('brazil-flag'),
  doctor:wholeScene('doctor-at-work'),teacher:wholeScene('teacher-at-work'),baker:wholeScene('baker-at-work'),
  'girl-drinking-water':wholeScene('child-drinking-water'),'girl-lost-toy':wholeScene('lost-toy-emotion'),'rainy-day':wholeScene('rain-context'),
  happy:wholeScene('happy-face'),sad:wholeScene('sad-face'),angry:wholeScene('angry-face'),
  umbrella:exactObject('umbrella'),sunglasses:exactObject('sunglasses'),
  'wait-turn':actionCrop('waiting-for-turn'),'grab-ball':actionCrop('taking-ball'),'walk-away-angry':actionCrop('walking-away-angry'),
  'ask-help':actionCrop('asking-for-help'),'throw-blocks':actionCrop('throwing-blocks'),'kick-blocks':actionCrop('kicking-blocks'),
  'wet-hands':actionCrop('hands-under-water','76% 54%'),'soap':actionCrop('soap-on-hands','77% 54%'),'rub-hands':actionCrop('rubbing-hands','77% 54%'),'rinse-hands':actionCrop('rinsing-hands','77% 54%'),
  'stay-away':actionCrop('safe-distance-from-hot-surface','78% 52%'),'touch-hot':actionCrop('touching-hot-surface','78% 52%'),'play-near-hot':actionCrop('playing-near-hot-surface','78% 52%'),
  'return-book':actionCrop('returning-book','76% 52%'),'leave-book-floor':actionCrop('book-left-on-floor','76% 52%'),'damage-book':actionCrop('damaging-book','76% 52%'),
  'help-tidy':actionCrop('helping-tidy','78% 52%'),'leave-mess':actionCrop('leaving-mess','78% 52%'),'scatter-toys':actionCrop('scattering-toys','78% 52%'),
  wake:wholeScene('wake-up'), 'brush-teeth':actionCrop('brushing-teeth','72% 50%'), breakfast:wholeScene('eating-breakfast'),
  'ball-above-box':exactObject('ball-above-box'),'ball-inside-box':exactObject('ball-inside-box'),'ball-below-box':exactObject('ball-below-box'),
  balance:Object.freeze({role:'guided-action',fit:'contain',position:'50% 50%',semanticFocus:'balance-one-foot',renderMode:'vector'}),
  'fine-motor':Object.freeze({role:'guided-action',fit:'contain',position:'50% 50%',semanticFocus:'transfer-three-safe-pieces',renderMode:'vector'})
});

export function getMashaalAssetContract(key){
  return CONTRACTS[String(key)]||DEFAULT_CONTRACT;
}

export function listMashaalAssetContractKeys(){return Object.keys(CONTRACTS);}
