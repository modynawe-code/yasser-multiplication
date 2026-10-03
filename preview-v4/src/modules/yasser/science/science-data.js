export const YASSER_SCIENCE_SCOPE=Object.freeze({
  id:'grade6-f1-period1',
  label:'سادس ابتدائي • الفصل الأول • الفترة الأولى',
  curriculumYear:'1448',
  status:'active'
});

export const YASSER_SCIENCE_ASSETS=Object.freeze({
  'cell-comparison':Object.freeze({
    id:'cell-comparison',
    src:'assets/science/yasser/cell-comparison-exam.webp',
    alt:'صورة مقارنة بين خلية حيوانية وخلية نباتية كما تظهر في نموذج اختبار',
    source:Object.freeze({label:'اختبار فترة علوم سادس ف1',page:14,kind:'uploaded-exam'})
  }),
  'organization-levels':Object.freeze({
    id:'organization-levels',
    src:'assets/science/yasser/organization-levels-exam.webp',
    alt:'مخطط فارغ من خمس خانات لمستويات التنظيم في المخلوقات الحية',
    source:Object.freeze({label:'اختبار فترة علوم سادس ف1',page:15,kind:'uploaded-exam'})
  }),
  'meiosis':Object.freeze({
    id:'meiosis',
    src:'assets/science/yasser/meiosis-exam.webp',
    alt:'رسم تخطيطي للانقسام المنصف يظهر خلية بها 46 كروموسوما ثم أربع خلايا بها 23 كروموسوما',
    source:Object.freeze({label:'اختبار فترة علوم سادس ف1',page:7,kind:'uploaded-exam'})
  }),
  'heart':Object.freeze({
    id:'heart',
    src:'assets/science/yasser/heart-exam.webp',
    alt:'صورة للقلب مستخدمة في نموذج اختبار العلوم',
    source:Object.freeze({label:'اختبار فترة علوم سادس ف1',page:6,kind:'uploaded-exam'})
  }),
  'bird-nest':Object.freeze({
    id:'bird-nest',
    src:'assets/science/yasser/bird-nest-exam.webp',
    alt:'رسم لطائر بجانب عشه كما ورد في نموذج اختبار الفترة الأولى',
    source:Object.freeze({label:'اختبار فترة علوم سادس ف1',page:10,kind:'uploaded-exam'})
  }),
  'pedigree':Object.freeze({
    id:'pedigree',
    src:'assets/science/yasser/pedigree-summary.webp',
    alt:'مخطط سلالة يوضح الوالدين والأبناء ورموز الذكور والإناث والصفات',
    source:Object.freeze({label:'ملخص علوم سادس ف1',page:25,kind:'uploaded-summary'})
  })
});

const source=(label,page,kind='uploaded-exam')=>Object.freeze({label,page,kind});
const q=(question)=>Object.freeze({...question,choices:Object.freeze(question.choices),source:Object.freeze(question.source)});

export const YASSER_SCIENCE_QUESTIONS=Object.freeze([
  q({id:'cell-energy-01',unit:'cells',concept:'mitochondria',type:'choice',difficulty:1,prompt:'أي مما يلي يعد مركز الطاقة في الخلية؟',choices:['الجدار الخلوي','السيتوبلازم','الميتوكندريا','الفجوات'],answer:'الميتوكندريا',feedback:'الصحيح: الميتوكندريا — مركز الطاقة في الخلية.',source:source('اختبار فترة علوم سادس 1447',2)}),
  q({id:'cell-hooke-01',unit:'cells',concept:'cell-discovery',type:'choice',difficulty:1,prompt:'من أول من شاهد الخلية؟',choices:['روبرت هوك','مندل','براون','ليفنهوك'],answer:'روبرت هوك',feedback:'الصحيح: روبرت هوك.',source:source('اختبار فترة علوم سادس 1447',2)}),
  q({id:'heart-organ-01',unit:'organization',concept:'organ',type:'choice',difficulty:1,prompt:'القلب هو عبارة عن ماذا؟',choices:['خلية','نسيج','عضو','جهاز حيوي'],answer:'عضو',feedback:'الصحيح: عضو.',assetId:'heart',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'heart-organization-02',unit:'organization',concept:'organization-levels',type:'choice',difficulty:2,prompt:'القلب في الصورة مثال على عضو. أي مستوى يسبقه مباشرة في مستويات التنظيم؟',choices:['نسيج','خلية','جهاز حيوي','مخلوق حي'],answer:'نسيج',feedback:'الصحيح: النسيج يسبق العضو مباشرة.',assetId:'heart',source:source('اختبار فترة علوم سادس ف1',15)}),
  q({id:'learned-dolphin-01',unit:'heredity',concept:'learned-trait',type:'choice',difficulty:1,prompt:'لعب الدلفين بالكرة مثال على ماذا؟',choices:['غريزة','صفة موروثة','صفة مكتسبة','صفة متنحية'],answer:'صفة مكتسبة',feedback:'الصحيح: صفة مكتسبة — تُتعلم بالتدريب.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'mendel-01',unit:'heredity',concept:'mendel',type:'choice',difficulty:1,prompt:'من اكتشف المبادئ الأساسية لعلم الوراثة؟',choices:['روبرت هوك','مندل','براون','ليفنهوك'],answer:'مندل',feedback:'الصحيح: مندل.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'genes-chromosomes-01',unit:'heredity',concept:'genes',type:'trueFalse',difficulty:1,prompt:'تتحكم الجينات في الصفات الوراثية وتوجد على الكروموسومات.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح — الجينات مرتبطة بالصفات الوراثية وتوجد على الكروموسومات.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'photosynthesis-products-01',unit:'cell-processes',concept:'photosynthesis-products',type:'trueFalse',difficulty:2,prompt:'ينتج عن عملية البناء الضوئي الأكسجين والماء.',choices:['صح','خطأ'],answer:'خطأ',feedback:'العبارة خطأ — من نواتج البناء الضوئي سكر الجلوكوز والأكسجين.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'passive-energy-01',unit:'cell-processes',concept:'passive-transport',type:'trueFalse',difficulty:1,prompt:'النقل السلبي يحتاج إلى طاقة لكي يحدث.',choices:['صح','خطأ'],answer:'خطأ',feedback:'العبارة خطأ — النقل السلبي لا يحتاج إلى طاقة.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'living-cells-01',unit:'cells',concept:'cell-theory',type:'trueFalse',difficulty:1,prompt:'جميع المخلوقات الحية تتكون من خلية أو أكثر.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح — من أفكار نظرية الخلية.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'vacuoles-01',unit:'cells',concept:'plant-animal-cell',type:'trueFalse',difficulty:1,prompt:'الفجوات في الخلية النباتية أكبر من الفجوات في الخلية الحيوانية.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح — الفجوة في الخلية النباتية كبيرة.',source:source('اختبار فترة علوم سادس 1447',6)}),
  q({id:'cell-basic-unit-01',unit:'cells',concept:'cell-theory',type:'trueFalse',difficulty:1,prompt:'الخلايا هي الوحدة الأساسية للتركيب والوظيفة في المخلوقات الحية.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'active-transport-01',unit:'cell-processes',concept:'active-transport',type:'trueFalse',difficulty:1,prompt:'النقل النشط هو انتقال المواد عبر الأغشية دون الحاجة إلى طاقة.',choices:['صح','خطأ'],answer:'خطأ',feedback:'العبارة خطأ — النقل النشط يحتاج إلى طاقة.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'spider-instinct-01',unit:'heredity',concept:'instinct',type:'trueFalse',difficulty:1,prompt:'بناء العنكبوت عشه سلوك غريزي.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح — الغريزة سلوك يولد به الحيوان.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'respiration-light-01',unit:'cell-processes',concept:'cellular-respiration',type:'trueFalse',difficulty:2,prompt:'التنفس الخلوي لا يتم إلا بوجود الضوء.',choices:['صح','خطأ'],answer:'خطأ',feedback:'العبارة خطأ — التنفس الخلوي لا يعتمد على وجود الضوء.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'dominant-01',unit:'heredity',concept:'dominant-trait',type:'choice',difficulty:1,prompt:'الصفة التي تمنع صفة أخرى من الظهور تسمى:',choices:['صفة سائدة','صفة متنحية','غريزة','صفة مكتسبة'],answer:'صفة سائدة',feedback:'الصحيح: صفة سائدة.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'tissue-01',unit:'organization',concept:'tissue',type:'choice',difficulty:1,prompt:'مجموعة من الخلايا المتشابهة تقوم بالوظيفة نفسها تسمى:',choices:['نسيج','عضو','جهاز حيوي','مخلوق حي'],answer:'نسيج',feedback:'الصحيح: نسيج.',source:source('اختبار فترة علوم سادس 1447',7)}),
  q({id:'photosynthesis-needs-01',unit:'cell-processes',concept:'photosynthesis-inputs',type:'choice',difficulty:2,prompt:'ما المواد التي يحتاج إليها النبات للقيام بعملية البناء الضوئي؟',choices:['ثاني أكسيد الكربون + ماء + ضوء','أكسجين + ماء فقط','سكر + أكسجين','ماء فقط'],answer:'ثاني أكسيد الكربون + ماء + ضوء',feedback:'الصحيح: ثاني أكسيد الكربون + ماء + ضوء.',source:source('اختبار منتصف الفصل علوم سادس 1446',2)}),
  q({id:'inheritance-01',unit:'heredity',concept:'inheritance',type:'choice',difficulty:1,prompt:'انتقال الصفات من الآباء إلى الأبناء يسمى:',choices:['الوراثة','دورة الخلية','النسيج','الانتشار'],answer:'الوراثة',feedback:'الصحيح: الوراثة.',source:source('اختبار منتصف الفصل علوم سادس 1446',1)}),
  q({id:'cell-cycle-01',unit:'division',concept:'cell-cycle',type:'choice',difficulty:1,prompt:'العملية المستمرة في النمو والانقسام والتعويض تسمى:',choices:['دورة الخلية','الوراثة','الانتشار','البناء الضوئي'],answer:'دورة الخلية',feedback:'الصحيح: دورة الخلية.',source:source('اختبار منتصف الفصل علوم سادس 1446',1)}),
  q({id:'nucleus-info-01',unit:'cells',concept:'nucleus',type:'trueFalse',difficulty:1,prompt:'تحتوي النواة على معظم المعلومات الوراثية للخلية.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح.',source:source('اختبار منتصف الفصل علوم سادس 1446',4)}),
  q({id:'brown-nucleus-01',unit:'cells',concept:'cell-discovery',type:'trueFalse',difficulty:2,prompt:'يعد العالم براون مكتشف نواة الخلية.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح.',source:source('اختبار منتصف الفصل علوم سادس 1446',4)}),
  q({id:'organization-image-01',unit:'organization',concept:'organization-levels',type:'choice',difficulty:2,prompt:'اختر الترتيب الصحيح لمستويات التنظيم من الأصغر إلى الأكبر.',choices:['خلية ← نسيج ← عضو ← جهاز حيوي ← مخلوق حي','نسيج ← خلية ← عضو ← مخلوق حي ← جهاز حيوي','خلية ← عضو ← نسيج ← جهاز حيوي ← مخلوق حي','عضو ← نسيج ← خلية ← جهاز حيوي ← مخلوق حي'],answer:'خلية ← نسيج ← عضو ← جهاز حيوي ← مخلوق حي',feedback:'الصحيح: خلية ← نسيج ← عضو ← جهاز حيوي ← مخلوق حي.',assetId:'organization-levels',source:source('اختبار فترة علوم سادس ف1',15)}),
  q({id:'organization-image-tissue-01',unit:'organization',concept:'organization-levels',type:'choice',difficulty:1,prompt:'في مخطط مستويات التنظيم، ما المستوى الذي يأتي مباشرة بعد الخلية؟',choices:['نسيج','عضو','جهاز حيوي','مخلوق حي'],answer:'نسيج',feedback:'الصحيح: النسيج يأتي بعد الخلية مباشرة.',assetId:'organization-levels',source:source('اختبار فترة علوم سادس ف1',15)}),
  q({id:'cell-image-wall-01',unit:'cells',concept:'plant-animal-cell',type:'choice',difficulty:2,prompt:'بالنظر إلى الصورتين: أي تركيب يميز الخلية النباتية ولا يوجد في الخلية الحيوانية؟',choices:['الجدار الخلوي','النواة','الميتوكندريا','الغشاء البلازمي'],answer:'الجدار الخلوي',feedback:'الصحيح: الجدار الخلوي.',assetId:'cell-comparison',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'cell-image-vacuole-01',unit:'cells',concept:'plant-animal-cell',type:'choice',difficulty:2,prompt:'أي خلية في الصورة تتميز بفجوة كبيرة؟',choices:['الخلية النباتية','الخلية الحيوانية','كلتاهما بالحجم نفسه','لا توجد فجوات'],answer:'الخلية النباتية',feedback:'الصحيح: الخلية النباتية.',assetId:'cell-comparison',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'cell-image-plastids-01',unit:'cells',concept:'plant-animal-cell',type:'choice',difficulty:2,prompt:'في مقارنة الخليتين، أي تركيب يوجد في الخلية النباتية ولا يوجد في الخلية الحيوانية؟',choices:['البلاستيدات الخضراء','النواة','الميتوكندريا','الغشاء البلازمي'],answer:'البلاستيدات الخضراء',feedback:'الصحيح: البلاستيدات الخضراء.',assetId:'cell-comparison',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'meiosis-image-cells-01',unit:'division',concept:'meiosis',type:'choice',difficulty:1,prompt:'حسب الرسم، كم عدد الخلايا الناتجة في نهاية الانقسام المنصف؟',choices:['2','3','4','6'],answer:'4',feedback:'الصحيح: 4 خلايا ناتجة.',assetId:'meiosis',source:source('اختبار فترة علوم سادس 1447',7)}),
  q({id:'meiosis-image-chromosomes-01',unit:'division',concept:'meiosis',type:'choice',difficulty:2,prompt:'حسب الرسم، كم عدد الكروموسومات في كل خلية ناتجة؟',choices:['46','23','92','12'],answer:'23',feedback:'الصحيح: 23 كروموسومًا.',assetId:'meiosis',source:source('اختبار فترة علوم سادس 1447',7)}),
  q({id:'meiosis-image-divisions-02',unit:'division',concept:'meiosis',type:'choice',difficulty:2,prompt:'حسب مخطط الانقسام المنصف، كم عدد الانقسامات التي تمر بها الخلية الأصلية؟',choices:['1','2','3','4'],answer:'2',feedback:'الصحيح: الانقسام المنصف يمر بانقسامين.',assetId:'meiosis',source:source('اختبار فترة علوم سادس 1447',7)}),
  q({id:'mitosis-divisions-01',unit:'division',concept:'mitosis',type:'choice',difficulty:1,prompt:'كم عدد الانقسامات في الانقسام المتساوي؟',choices:['1','2','3','4'],answer:'1',feedback:'الصحيح: انقسام واحد.',source:source('اختبار فترة علوم سادس 1447',5)}),
  q({id:'meiosis-divisions-01',unit:'division',concept:'meiosis',type:'choice',difficulty:1,prompt:'كم عدد الانقسامات في الانقسام المنصف؟',choices:['1','2','3','4'],answer:'2',feedback:'الصحيح: انقسامان.',source:source('اختبار فترة علوم سادس 1447',5)}),
  q({id:'mitosis-output-01',unit:'division',concept:'mitosis',type:'choice',difficulty:1,prompt:'كم عدد الخلايا الناتجة عن الانقسام المتساوي؟',choices:['2','4','6','8'],answer:'2',feedback:'الصحيح: خليتان.',source:source('اختبار فترة علوم سادس 1447',5)}),
  q({id:'meiosis-output-01',unit:'division',concept:'meiosis',type:'choice',difficulty:1,prompt:'كم عدد الخلايا الناتجة عن الانقسام المنصف؟',choices:['2','3','4','8'],answer:'4',feedback:'الصحيح: أربع خلايا.',source:source('اختبار فترة علوم سادس 1447',5)}),
  q({id:'animal-wall-01',unit:'cells',concept:'plant-animal-cell',type:'trueFalse',difficulty:1,prompt:'تحتوي الخلايا الحيوانية على جدار خلوي.',choices:['صح','خطأ'],answer:'خطأ',feedback:'العبارة خطأ — الجدار الخلوي يميز الخلية النباتية.',source:source('اختبار منتصف الفصل علوم سادس 1446',4)}),
  q({id:'nucleus-both-01',unit:'cells',concept:'plant-animal-cell',type:'trueFalse',difficulty:1,prompt:'توجد النواة في الخلية النباتية والخلية الحيوانية.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح.',source:source('اختبار منتصف الفصل علوم سادس 1446',1)}),
  q({id:'active-energy-02',unit:'cell-processes',concept:'active-transport',type:'trueFalse',difficulty:1,prompt:'النقل النشط انتقال للمواد عبر الأغشية مع وجود طاقة.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح.',source:source('اختبار منتصف الفصل علوم سادس 1446',4)}),
  q({id:'passive-direction-01',unit:'cell-processes',concept:'passive-transport',type:'choice',difficulty:2,prompt:'في النقل السلبي تنتقل المواد غالبًا من منطقة:',choices:['التركيز المرتفع إلى التركيز المنخفض','التركيز المنخفض إلى التركيز المرتفع','المتساوي إلى الأعلى فقط','لا تتحرك المواد'],answer:'التركيز المرتفع إلى التركيز المنخفض',feedback:'الصحيح: من التركيز المرتفع إلى التركيز المنخفض.',source:source('ملخص علوم سادس ف1',16,'uploaded-summary')}),
  q({id:'eye-color-01',unit:'heredity',concept:'inherited-trait',type:'choice',difficulty:1,prompt:'أي مما يلي مثال على صفة موروثة؟',choices:['لون العين','تعلم السباحة','لعب الكرة','الكتابة'],answer:'لون العين',feedback:'الصحيح: لون العين.',source:source('اختبار منتصف الفصل علوم سادس 1446',4)}),
  q({id:'bird-nest-instinct-01',unit:'heredity',concept:'instinct',type:'choice',difficulty:1,prompt:'بالنظر إلى الصورة، بناء الطائر لعشه يعد:',choices:['سلوكًا مكتسبًا','غريزة','صفة سائدة','صفة متنحية'],answer:'غريزة',feedback:'الصحيح: غريزة — سلوك يولد به الحيوان.',assetId:'bird-nest',source:source('اختبار فترة علوم سادس ف1',10)}),
  q({id:'bird-nest-instinct-02',unit:'heredity',concept:'instinct',type:'trueFalse',difficulty:2,prompt:'الصورة تمثل مثالًا على سلوك فطري لا يحتاج الطائر إلى تعلمه من التدريب.',choices:['صح','خطأ'],answer:'صح',feedback:'صحيح — بناء العش مثال على الغريزة.',assetId:'bird-nest',source:source('اختبار فترة علوم سادس ف1',10)}),
  q({id:'pedigree-male-01',unit:'heredity',concept:'pedigree',type:'choice',difficulty:1,prompt:'في مخطط السلالة بالصورة، أي شكل يرمز إلى الذكر؟',choices:['المربع','الدائرة','المثلث','السهم'],answer:'المربع',feedback:'الصحيح: المربع يرمز إلى الذكر.',assetId:'pedigree',source:source('ملخص علوم سادس ف1',25,'uploaded-summary')}),
  q({id:'pedigree-female-01',unit:'heredity',concept:'pedigree',type:'choice',difficulty:1,prompt:'في مخطط السلالة بالصورة، أي شكل يرمز إلى الأنثى؟',choices:['الدائرة','المربع','المثلث','السهم'],answer:'الدائرة',feedback:'الصحيح: الدائرة ترمز إلى الأنثى.',assetId:'pedigree',source:source('ملخص علوم سادس ف1',25,'uploaded-summary')}),
  q({id:'pedigree-lines-01',unit:'heredity',concept:'pedigree',type:'choice',difficulty:2,prompt:'في مخطط السلالة، ما وظيفة الخطوط العمودية؟',choices:['تربط الآباء بالأبناء','تربط الأبوين معًا فقط','تحدد الذكور فقط','تحدد الصفة السائدة'],answer:'تربط الآباء بالأبناء',feedback:'الصحيح: الخطوط العمودية تربط الآباء بالأبناء.',assetId:'pedigree',source:source('ملخص علوم سادس ف1',25,'uploaded-summary')}),
  q({id:'pedigree-recessive-01',unit:'heredity',concept:'recessive-trait',type:'choice',difficulty:2,prompt:'حسب مفتاح مخطط السلالة، الأشكال البيضاء تمثل:',choices:['صفة متنحية','صفة سائدة','صفة مكتسبة','غريزة'],answer:'صفة متنحية',feedback:'الصحيح: الأشكال البيضاء تمثل الصفة المتنحية في هذا المخطط.',assetId:'pedigree',source:source('ملخص علوم سادس ف1',25,'uploaded-summary')}),
  q({id:'carrier-01',unit:'heredity',concept:'carrier',type:'choice',difficulty:2,prompt:'ما المصطلح العلمي للشخص الذي ينقل جين الصفة ولكنها لا تظهر عليه؟',choices:['الحامل للصفة','صاحب الصفة السائدة','المتكيف','المكتسب'],answer:'الحامل للصفة',feedback:'الصحيح: الحامل للصفة.',assetId:'pedigree',source:source('ملخص علوم سادس ف1',25,'uploaded-summary')}),
  q({id:'equilibrium-01',unit:'cell-processes',concept:'equilibrium',type:'choice',difficulty:2,prompt:'عندما يكون تركيز المادة متساويًا على جانبي الغشاء البلازمي فإن المادة تكون في حالة:',choices:['اتزان','تخمر','نقل نشط','انقسام'],answer:'اتزان',feedback:'الصحيح: اتزان.',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'active-direction-02',unit:'cell-processes',concept:'active-transport',type:'choice',difficulty:2,prompt:'ما العملية التي تنقل المواد من منطقة التركيز المنخفض إلى منطقة التركيز المرتفع وتحتاج إلى طاقة؟',choices:['النقل النشط','النقل السلبي','الانتشار','الأسموزية'],answer:'النقل النشط',feedback:'الصحيح: النقل النشط — يحتاج إلى طاقة.',source:source('اختبار فترة علوم سادس ف1',15)}),
  q({id:'chromosome-term-01',unit:'heredity',concept:'chromosomes',type:'choice',difficulty:1,prompt:'أشرطة صغيرة داخل النواة تحمل المعلومات الوراثية تسمى:',choices:['الكروموسومات','الفجوات','الميتوكندريا','الأنسجة'],answer:'الكروموسومات',feedback:'الصحيح: الكروموسومات.',source:source('اختبار فترة علوم سادس ف1',15)}),
  q({id:'single-cell-life-01',unit:'cells',concept:'unicellular',type:'choice',difficulty:2,prompt:'تختلف خلية المخلوق الحي وحيد الخلية عن خلية المخلوق عديد الخلايا في أنها:',choices:['تؤدي جميع وظائف الحياة','لا تحتوي نواة','لا تحتاج إلى طاقة','لا تحتوي غشاء بلازمي'],answer:'تؤدي جميع وظائف الحياة',feedback:'الصحيح: خلية المخلوق وحيد الخلية تؤدي جميع وظائف الحياة.',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'fertilized-cell-01',unit:'division',concept:'fertilization',type:'choice',difficulty:1,prompt:'تنتج الخلية المخصبة بسبب:',choices:['اندماج الخلايا الجنسية','انقسام الخلايا الجسمية','النقل السلبي','البناء الضوئي'],answer:'اندماج الخلايا الجنسية',feedback:'الصحيح: تنتج من اندماج الخلايا الجنسية.',source:source('اختبار فترة علوم سادس ف1',14)}),
  q({id:'life-span-01',unit:'division',concept:'life-span',type:'choice',difficulty:2,prompt:'أطول فترة زمنية يعيشها المخلوق الحي في أفضل الظروف تسمى:',choices:['مدة الحياة','متوسط العمر','العمر الافتراضي','دورة الخلية'],answer:'مدة الحياة',feedback:'الصحيح: مدة الحياة.',source:source('اختبار فترة علوم سادس ف1',15)})
]);

export const YASSER_SCIENCE_UNITS=Object.freeze([
  Object.freeze({id:'cells',label:'الخلايا ونظرية الخلية'}),
  Object.freeze({id:'organization',label:'مستويات التنظيم'}),
  Object.freeze({id:'cell-processes',label:'عمليات الخلية'}),
  Object.freeze({id:'division',label:'الانقسام ودورة الخلية'}),
  Object.freeze({id:'heredity',label:'الوراثة والصفات'})
]);
