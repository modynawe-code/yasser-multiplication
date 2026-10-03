import {createQuestionRecord} from '../../../shared/question-bank/index.js';

const scope=Object.freeze({
  subjectId:'science',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',
  unitId:'unit-1-diversity-of-life',chapterId:'chapter-1-cells'
});

const theoryTextbook=Object.freeze({
  label:'كتاب العلوم سادس ف1 - نظرية الخلية',provider:'وزارة التعليم عبر عرض سهل',
  url:'https://sahl.io/sa/lesson/528/',year:'1448',examType:'textbook',authority:'textbook',kind:'textbook-mirror'
});
const plantAnimalTextbook=Object.freeze({
  label:'كتاب العلوم سادس ف1 - الخلية النباتية والخلية الحيوانية',provider:'وزارة التعليم عبر عرض سهل',
  url:'https://sahl.io/sa/lesson/529/',year:'1448',examType:'textbook',authority:'textbook',kind:'textbook-mirror'
});
const wordwallCells=Object.freeze({
  label:'علوم سادس الفصل الأول - الخلايا',provider:'Wordwall',
  url:'https://wordwall.net/ar/resource/97439933/',examType:'chapter-review',authority:'training-model',kind:'public-question-set'
});
const wordwallChapterReview=Object.freeze({
  label:'مراجعة الفصل الأول علوم سادس ص12-30',provider:'Wordwall',
  url:'https://wordwall.net/ar/resource/6062143/',examType:'chapter-review',authority:'training-model',kind:'public-question-set'
});
const telegramSpec=Object.freeze({
  label:'أسئلة درس نظرية الخلية حسب جدول المواصفات',provider:'قناة الصف السادس / المناهج السعودية',
  url:'https://t.me/s/grade6sa?before=4136',year:'1447_1448',examType:'lesson-specification',authority:'teacher-model',kind:'telegram-public'
});
const wajibatiTelegram=Object.freeze({
  label:'اختبارات علوم سادس ف1 1447 مع نماذج الحل',provider:'واجباتي / Telegram',
  url:'https://t.me/s/wajibatii?before=2146',year:'1447',examType:'exam-bank',authority:'training-model',kind:'telegram-public'
});

const q=(input)=>createQuestionRecord({
  ...scope,
  difficulty:input.difficulty||1,
  tags:['science','grade-6','term-1','unit-1','chapter-1','collected','answer-verified','batch-2'],
  verified:true,
  ...input
});

export const YASSER_SCIENCE_COLLECTED_QUESTIONS_BATCH2=Object.freeze([
  q({
    id:'science:collected:leeuwenhoek-magnification-01',topicId:'cell-theory',conceptId:'cell-discovery',type:'choice',difficulty:2,
    prompt:'كانت قوة تكبير مجهر ليفنهوك أكبر من قوة تكبير مجهر روبرت هوك بمقدار:',
    choices:['ثلاث مرات','ست مرات','تسع مرات','اثنتي عشرة مرة'],answer:'تسع مرات',
    explanation:'يذكر الكتاب أن قوة تكبير مجهر ليفنهوك كانت أكبر تسع مرات من قوة تكبير مجهر روبرت هوك.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:brown-1831-01',topicId:'cell-theory',conceptId:'cell-discovery',type:'choice',
    prompt:'من العالم الذي اكتشف نواة الخلية النباتية عام 1831م؟',
    choices:['روبرت براون','روبرت هوك','ليفنهوك','ثيودور شفان'],answer:'روبرت براون',
    explanation:'اكتشف العالم الإسكتلندي روبرت براون نواة الخلية النباتية عام 1831م.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:schleiden-1838-01',topicId:'cell-theory',conceptId:'cell-theory-development',type:'choice',
    prompt:'من استنتج عام 1838م أن جميع النباتات تتكون من خلايا؟',
    choices:['شلايدن','شفان','روبرت هوك','ليفنهوك'],answer:'شلايدن',
    explanation:'استنتج شلايدن عام 1838م أن جميع النباتات تتكون من خلايا.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:schwann-1839-01',topicId:'cell-theory',conceptId:'cell-theory-development',type:'choice',
    prompt:'من اكتشف بعد شلايدن بسنة أن جميع الحيوانات تتكون من خلايا؟',
    choices:['ثيودور شفان','روبرت براون','روبرت هوك','مندل'],answer:'ثيودور شفان',
    explanation:'بعد استنتاج شلايدن بسنة، توصل ثيودور شفان إلى أن جميع الحيوانات تتكون من خلايا.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:microscope-cell-discovery-01',topicId:'cell-theory',conceptId:'cell-discovery',type:'trueFalse',
    prompt:'لم يعرف الناس بوجود الخلايا قبل اختراع المجاهر القادرة على تكبيرها ورؤيتها.',
    choices:['صح','خطأ'],answer:'صح',
    explanation:'الخلايا صغيرة جدًا، وكان تطوير المجاهر أساسًا لاكتشافها ودراسة تفاصيلها.',
    sources:[wordwallCells,theoryTextbook]
  }),
  q({
    id:'science:collected:water-cell-percentage-01',topicId:'cell-chemistry',conceptId:'water-in-cells',type:'choice',
    prompt:'تقريبًا، ما النسبة التي يشكلها الماء من مكونات خلايا الإنسان وفق الشكل في الكتاب؟',
    choices:['10%','25%','50%','70%'],answer:'70%',
    explanation:'يوضح شكل مكونات خلايا الإنسان في الدرس أن الماء يشكل نحو 70% منها.',
    sources:[wordwallCells,wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:water-is-compound-02',topicId:'cell-chemistry',conceptId:'compound',type:'choice',
    prompt:'يتكون الماء من الهيدروجين والأكسجين؛ لذلك يصنف الماء على أنه:',
    choices:['مركب','عنصر','ذرة','خلية'],answer:'مركب',
    explanation:'المركب مادة تنتج من اتحاد كيميائي بين عنصرين أو أكثر، والماء يتكون من الهيدروجين والأكسجين.',
    sources:[theoryTextbook]
  }),
  q({
    id:'science:collected:salt-is-compound-01',topicId:'cell-chemistry',conceptId:'compound',type:'choice',difficulty:2,
    prompt:'وفق تعريف المركب، كيف يصنف ملح الطعام؟',
    choices:['مركب','عنصر','خلية','نسيج'],answer:'مركب',
    explanation:'ملح الطعام مركب؛ لأنه يتكون من اتحاد كيميائي بين عنصرين.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:diffusion-high-low-01',topicId:'cell-processes',conceptId:'diffusion',type:'choice',difficulty:2,
    prompt:'في الانتشار تنتقل المواد مثل الأكسجين وثاني أكسيد الكربون غالبًا من:',
    choices:['منطقة التركيز المرتفع إلى منطقة التركيز المنخفض','منطقة التركيز المنخفض إلى منطقة التركيز المرتفع','الخلية إلى النواة فقط','منطقة الاتزان إلى التركيز المرتفع'],
    answer:'منطقة التركيز المرتفع إلى منطقة التركيز المنخفض',
    explanation:'الانتشار من صور النقل السلبي، وتتحرك فيه الجسيمات من التركيز الأعلى إلى التركيز الأقل.',
    sources:[wordwallCells,wordwallChapterReview,plantAnimalTextbook]
  }),
  q({
    id:'science:collected:osmosis-salt-direction-01',topicId:'cell-processes',conceptId:'osmosis',type:'choice',difficulty:3,
    prompt:'عند وضع شريحة بطاطس في ماء مالح، تتحرك جزيئات الماء بالخاصية الأسموزية باتجاه المنطقة:',
    choices:['ذات تركيز الأملاح الأعلى','ذات تركيز الأملاح الأقل دائمًا','التي لا تحتوي غشاءً','التي تحتوي جلوكوز أكثر فقط'],
    answer:'ذات تركيز الأملاح الأعلى',
    explanation:'يوضح نشاط الكتاب انتقال الماء بالخاصية الأسموزية من منطقة أملاح أقل إلى منطقة أملاح أعلى عبر الغشاء.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:tissue-types-set-01',topicId:'organization-levels',conceptId:'tissue-types',type:'choice',difficulty:2,
    prompt:'أي مجموعة تتكون كلها من أنواع أنسجة حيوانية وردت في درس نظرية الخلية؟',
    choices:['الطلائي والعصبي والضام والعضلي','الخشبي واللحائي والعصبي والعضلي','الطلائي والبلازمي والجدار والضام','العصبي والكلوروفيل والعضلي والضام'],
    answer:'الطلائي والعصبي والضام والعضلي',
    explanation:'يعرض الدرس أربعة أنواع من الأنسجة الحيوانية في النشاط: الطلائي والعصبي والضام والعضلي.',
    sources:[wordwallChapterReview,theoryTextbook]
  }),
  q({
    id:'science:collected:multicellular-specialized-01',topicId:'cell-theory',conceptId:'multicellular',type:'trueFalse',difficulty:2,
    prompt:'في المخلوقات عديدة الخلايا يمكن أن تتخصص خلايا مختلفة لأداء وظائف مختلفة.',
    choices:['صح','خطأ'],answer:'صح',
    explanation:'يذكر الكتاب أن المخلوقات عديدة الخلايا تحتوي خلايا مختلفة تقوم بوظائف متخصصة.',
    sources:[telegramSpec,theoryTextbook]
  }),
  q({
    id:'science:collected:membrane-entry-exit-01',topicId:'cell-processes',conceptId:'plasma-membrane',type:'choice',difficulty:2,
    prompt:'ما الوصف الأفضل لدور الغشاء أو الغطاء الرقيق المحيط بالخلية؟',
    choices:['يسمح بدخول مواد تحتاجها الخلية ويسمح بخروج الفضلات','يصنع جميع غذاء الخلية بنفسه','يمنع انتقال أي مادة','يوجد في الخلايا النباتية فقط'],
    answer:'يسمح بدخول مواد تحتاجها الخلية ويسمح بخروج الفضلات',
    explanation:'يصف الكتاب الغشاء بأنه يسمح بدخول الغذاء ومرور الفضلات إلى خارج الخلية.',
    sources:[theoryTextbook,plantAnimalTextbook]
  }),
  q({
    id:'science:collected:circulatory-system-example-01',topicId:'organization-levels',conceptId:'organ-system',type:'choice',difficulty:2,
    prompt:'أي مجموعة تمثل مكونات رئيسة لجهاز الدوران كما ورد مثالًا على الجهاز الحيوي؟',
    choices:['القلب والأوعية الدموية والدم','الرئتان والقصبة الهوائية فقط','المعدة والأمعاء والكبد','العظام والمفاصل فقط'],
    answer:'القلب والأوعية الدموية والدم',
    explanation:'يذكر الدرس أن جهاز الدوران يتكون من القلب والأوعية الدموية والدم، ويؤدي وظيفة نقل المواد والتخلص من الفضلات.',
    sources:[theoryTextbook,wajibatiTelegram]
  }),
  q({
    id:'science:collected:paramecium-euglena-unicellular-01',topicId:'cell-theory',conceptId:'unicellular',type:'choice',
    prompt:'أي زوج يمثل مخلوقات وحيدة الخلية كما ورد في الدرس؟',
    choices:['البراميسيوم واليوجلينا','الإنسان والبراميسيوم','الفولفكس والإنسان','الإنسان والنبات'],
    answer:'البراميسيوم واليوجلينا',
    explanation:'يذكر الكتاب أن البراميسيوم واليوجلينا من المخلوقات وحيدة الخلية.',
    sources:[theoryTextbook]
  })
]);
