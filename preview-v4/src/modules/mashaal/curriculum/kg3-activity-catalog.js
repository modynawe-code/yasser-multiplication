const SELS='saudi-early-learning-standards-3-6-2015';

const activity=(definition)=>Object.freeze({
  stage:'kg3',
  sourceId:SELS,
  status:'verified',
  evidenceType:'digital-attempt',
  childFacingScore:false,
  ...definition,
  indicatorRefs:Object.freeze([...definition.indicatorRefs]),
  choices:definition.choices?Object.freeze([...definition.choices]):undefined,
  stimulus:definition.stimulus?Object.freeze({...definition.stimulus}):undefined
});

export const MASHAAL_KG3_ACTIVITY_CATALOG = Object.freeze([
  activity({
    id:'kg3-listen-two-step-choice-01',
    skillId:'listen-follow-simple-directions',
    indicatorRefs:['LL 1.1.2'],
    interaction:'guided-play',
    promptAr:'اسمعي ونفذي بالترتيب.',
    audioPromptAr:'المسي النجمة ثم الكرة.',
    stimulus:{kind:'ordered-actions',actions:['star','ball']},
    choices:['star','ball','heart'],
    correctChoice:'star|ball'
  }),
  activity({
    id:'kg3-oral-expression-01',
    skillId:'oral-vocabulary-expression',
    indicatorRefs:['LL 1.5.1','LL 1.5.2'],
    interaction:'guided-play',
    evidenceType:'activity-completion',
    promptAr:'شوفي الصورة وقولي جملة عنها.',
    audioPromptAr:'شوفي البنت وهي تشرب ماء. قولي جملة كاملة عنها، وبعد ما تخلصين اضغطي تم.',
    stimulus:{kind:'picture-scene',scene:'girl-drinking-water'},
    choices:['done']
  }),
  activity({
    id:'kg3-story-sequence-01',
    skillId:'story-sequencing',
    indicatorRefs:['LL 2.5.1','LL 2.5.5'],
    interaction:'sequencing',
    promptAr:'رتبي أحداث القصة.',
    audioPromptAr:'رتبي الصور: استيقظت البنت، ثم فرشت أسنانها، ثم أكلت فطورها.',
    stimulus:{kind:'ordered-actions',actions:['wake','brush-teeth','breakfast']},
    choices:['breakfast','wake','brush-teeth'],
    correctChoice:'wake|brush-teeth|breakfast'
  }),
  activity({
    id:'kg3-sound-awareness-01',
    skillId:'sound-awareness',
    indicatorRefs:['LL 1.1.3'],
    interaction:'listening',
    promptAr:'اسمعي الصوت واختاري الصورة.',
    audioPromptAr:'أي صورة اسمها يبدأ بصوت ب؟ باب، تفاحة، قمر.',
    stimulus:{kind:'initial-sound',sound:'ب'},
    choices:['door','apple','moon'],
    correctChoice:'door'
  }),
  activity({
    id:'kg3-letter-sound-match-01',
    skillId:'letter-sound-readiness',
    indicatorRefs:['LL 2.4.1','LL 2.4.2','LL 2.4.3'],
    interaction:'matching',
    promptAr:'اسمعي الصوت ثم اختاري الحرف المطابق.',
    audioPromptAr:'اختاري الحرف الذي يصدر صوت ب.',
    stimulus:{kind:'letter-sound',sound:'ب'},
    choices:['ب','ت','م'],
    correctChoice:'ب'
  }),
  activity({
    id:'kg3-prewriting-path-01',
    skillId:'prewriting-fine-motor',
    indicatorRefs:['HP 2.2'],
    interaction:'guided-play',
    evidenceType:'activity-completion',
    promptAr:'اتبعي الطريق بإصبعك.',
    audioPromptAr:'ابدئي من الدائرة واتبعي الخط المتعرج بإصبعك حتى النجمة، وبعد ما تخلصين اضغطي تم.',
    stimulus:{kind:'trace-path',path:'wave'},
    choices:['done']
  }),
  activity({
    id:'kg3-count-quantity-01',
    skillId:'count-and-quantity',
    indicatorRefs:['CK 1.1.7'],
    interaction:'choice',
    promptAr:'عدّي الأشياء ثم اختاري العدد الصحيح.',
    audioPromptAr:'كم تفاحة ترين؟',
    stimulus:{kind:'countable-set',item:'apple',count:4},
    choices:['3','4','5'],
    correctChoice:'4'
  }),
  activity({
    id:'kg3-compare-quantity-01',
    skillId:'compare-quantities',
    indicatorRefs:['CK 1.1.8'],
    interaction:'choice',
    promptAr:'قارني المجموعتين ثم اختاري المجموعة التي فيها أكثر.',
    audioPromptAr:'أي مجموعة فيها أكثر؟',
    stimulus:{kind:'group-comparison',leftCount:3,rightCount:5},
    choices:['left','right'],
    correctChoice:'right'
  }),
  activity({
    id:'kg3-classify-sort-01',
    skillId:'classify-sort',
    indicatorRefs:['CK 1.2.1'],
    interaction:'sorting',
    promptAr:'اختاري كل الأشياء الحمراء.',
    audioPromptAr:'المسي كل الأشياء الحمراء ثم اضغطي تحقق.',
    stimulus:{kind:'attribute-sort',attribute:'color',target:'red'},
    choices:['red-circle','blue-circle','red-square','yellow-square'],
    correctChoice:'red-circle|red-square'
  }),
  activity({
    id:'kg3-pattern-01',
    skillId:'patterns',
    indicatorRefs:['CK 1.2.2'],
    interaction:'sequencing',
    promptAr:'انظري إلى النمط ثم اختاري ما يأتي بعده.',
    audioPromptAr:'دائرة، نجمة، دائرة، نجمة. ماذا يأتي بعد ذلك؟',
    stimulus:{kind:'pattern',sequence:['circle','star','circle','star']},
    choices:['circle','star','square'],
    correctChoice:'circle'
  }),
  activity({
    id:'kg3-spatial-position-01',
    skillId:'shapes-space',
    indicatorRefs:['CK 1.4.5','CK 1.4.6','CK 1.4.7'],
    interaction:'choice',
    promptAr:'انظري إلى المكان ثم اختاري الصورة المطابقة.',
    audioPromptAr:'أي صورة فيها الكرة فوق الصندوق؟',
    stimulus:{kind:'spatial-relation',relation:'above',subject:'ball',reference:'box'},
    choices:['ball-above-box','ball-inside-box','ball-below-box'],
    correctChoice:'ball-above-box'
  }),
  activity({
    id:'kg3-observe-reason-01',
    skillId:'observe-reason',
    indicatorRefs:['CK 2.1.5','AL 3.0.2'],
    interaction:'choice',
    promptAr:'فكري واختاري الشيء المناسب.',
    audioPromptAr:'المطر ينزل. أي شيء يساعد البنت تبقى جافة؟',
    stimulus:{kind:'picture-scene',scene:'rainy-day'},
    choices:['umbrella','sunglasses','ball'],
    correctChoice:'umbrella'
  })
]);

export function listMashaalKg3Activities(){return [...MASHAAL_KG3_ACTIVITY_CATALOG];}
export function listMashaalKg3ActivitiesBySkill(skillId){return MASHAAL_KG3_ACTIVITY_CATALOG.filter(item=>item.skillId===skillId);}
export function getMashaalKg3Activity(activityId){return MASHAAL_KG3_ACTIVITY_CATALOG.find(item=>item.id===activityId)||null;}
