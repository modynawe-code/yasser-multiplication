import {createQuestionRecord} from '../../../shared/question-bank/index.js';

const BASE_SCOPE=Object.freeze({subjectId:'science',gradeId:'grade-6',termId:'term-1',curriculumYear:'1448',unitId:'unit-2-life-processes',chapterId:'chapter-3-plants-microorganisms'});
const SOURCES=Object.freeze({
  plant:Object.freeze({id:'textbook-c3-plants',label:'كتاب العلوم سادس - عمليات الحياة في النباتات',provider:'سهل - مرآة محتوى الكتاب',url:'https://sahl.io/sa/lesson/532/',year:'1446',examType:'أسئلة الكتاب ومراجعة الفصل',authority:'textbook',kind:'textbook-mirror'}),
  micro:Object.freeze({id:'textbook-c3-microorganisms',label:'كتاب العلوم سادس - عمليات الحياة في المخلوقات الحية الدقيقة',provider:'سهل - مرآة محتوى الكتاب',url:'https://sahl.io/sa/lesson/533/',year:'1446',examType:'أسئلة الكتاب ومراجعة الفصل',authority:'textbook',kind:'textbook-mirror'}),
  exam:Object.freeze({id:'madty-period2-1447',label:'اختبار الفترة الثانية علوم سادس ف1 1447',provider:'مادتي',url:'https://www.madty.net/exam-ftre-alom/',year:'1447',examType:'الفترة الثانية',authority:'training-model',kind:'past-exam-model'})
});

const q=(topicId,conceptId,type,prompt,choices,answer,explanation,difficulty=1,sources=[])=>createQuestionRecord({...BASE_SCOPE,id:`science:unit2:${conceptId}:${prompt.length}`,topicId,conceptId,type,prompt,choices,answer,explanation,difficulty,tags:['science','grade-6','term-1','unit-2','chapter-3','answer-verified'],sources,verified:true});

export const YASSER_SCIENCE_UNIT2_QUESTIONS=Object.freeze([
  q('plant-life-processes','roots','choice','أي جزء من النبات يثبته في التربة ويمتص الماء والأملاح؟',['الجذر','الورقة','الزهرة','الثمرة'],'الجذر','الجذور تثبت النبات وتمتص الماء والأملاح من التربة.',1,[SOURCES.plant,SOURCES.exam]),
  q('plant-life-processes','root-hairs','choice','ما الفائدة الأساسية للشعيرات الجذرية؟',['زيادة مساحة سطح الجذر لامتصاص الماء والأملاح','إنتاج حبوب اللقاح','حماية الأوراق','نقل الغذاء إلى الثمار فقط'],'زيادة مساحة سطح الجذر لامتصاص الماء والأملاح','تزيد الشعيرات الجذرية مساحة السطح المعرضة للتربة.',1,[SOURCES.plant]),
  q('plant-life-processes','root-cap','choice','ما وظيفة القلنسوة في الجذر؟',['حماية قمة الجذر أثناء اختراق التربة','صنع الغذاء','نقل السكر','إنتاج البذور'],'حماية قمة الجذر أثناء اختراق التربة','القلنسوة طبقة قاسية تحمي قمة الجذر.',2,[SOURCES.plant]),
  q('plant-life-processes','xylem','choice','أي نسيج ينقل الماء والأملاح المعدنية من الجذور إلى أعلى النبات؟',['الخشب','اللحاء','الكامبيوم','البشرة'],'الخشب','الخشب مسؤول عن نقل الماء والأملاح إلى أعلى.',1,[SOURCES.plant,SOURCES.exam]),
  q('plant-life-processes','phloem','choice','أي نسيج ينقل الغذاء المصنوع في الأوراق إلى بقية أجزاء النبات؟',['اللحاء','الخشب','القلنسوة','الشعيرات الجذرية'],'اللحاء','اللحاء ينقل الغذاء من الأوراق إلى بقية أجزاء النبات.',1,[SOURCES.plant,SOURCES.exam]),
  q('plant-life-processes','cambium','choice','ما اسم طبقة الخلايا التي تفصل بين الخشب واللحاء في الساق؟',['الكامبيوم','البشرة','القلنسوة','الثغر'],'الكامبيوم','الكامبيوم طبقة من الخلايا بين الخشب واللحاء.',2,[SOURCES.plant]),
  q('plant-life-processes','transpiration','choice','خروج الماء إلى الغلاف الجوي عن طريق أوراق النبات يسمى:',['النتح','التلقيح','الاقتران','الانشطار الثنائي'],'النتح','النتح هو فقد النبات للماء عبر الأوراق إلى الجو.',1,[SOURCES.plant]),
  q('plant-life-processes','stomata','choice','ما اسم الفتحات الصغيرة جدًا الموجودة في بشرة الورقة؟',['الثغور','الأهداب','الأسواط','الأبواغ'],'الثغور','الثغور فتحات صغيرة في بشرة الورقة.',1,[SOURCES.plant]),
  q('plant-life-processes','photosynthesis','choice','ما العملية التي يستخدم فيها النبات ضوء الشمس لإنتاج الغذاء؟',['البناء الضوئي','التنفس','الإخراج','الدوران'],'البناء الضوئي','البناء الضوئي يستخدم الضوء لإنتاج الغذاء.',1,[SOURCES.plant,SOURCES.exam]),
  q('plant-life-processes','pollination','choice','انتقال حبوب اللقاح من المتك إلى الميسم يسمى:',['التلقيح','النتح','الإنبات','التبرعم'],'التلقيح','التلقيح هو انتقال حبوب اللقاح من المتك إلى الميسم.',1,[SOURCES.plant,SOURCES.exam]),
  q('plant-life-processes','anther','choice','أي جزء من الزهرة ينتج حبوب اللقاح؟',['المتك','الميسم','القلم','المبيض'],'المتك','حبوب اللقاح تنتج في المتك.',1,[SOURCES.plant]),
  q('plant-life-processes','xylem-phloem','trueFalse','اللحاء هو الذي ينقل الماء والأملاح المعدنية من التربة إلى أعلى النبات.',['صح','خطأ'],'خطأ','الخشب ينقل الماء والأملاح، أما اللحاء فينقل الغذاء.',2,[SOURCES.plant,SOURCES.exam]),
  q('microorganism-life-processes','microorganism','choice','ما الوصف الأدق للمخلوق الحي الدقيق؟',['مخلوق حي مجهري لا يُرى بالعين المجردة','أي مخلوق يعيش في الماء','نبات صغير فقط','حيوان صغير فقط'],'مخلوق حي مجهري لا يُرى بالعين المجردة','المخلوقات الحية الدقيقة مجهرية وقد تكون وحيدة الخلية أو متعددة الخلايا.',1,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','bacteria','trueFalse','البكتيريا من المخلوقات الحية الدقيقة.',['صح','خطأ'],'صح','البكتيريا مخلوقات حية دقيقة وحيدة الخلية.',1,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','yeast','choice','أي مما يلي مثال على فطر مجهري؟',['الخميرة','النحلة','الصنوبر','السمكة'],'الخميرة','الخميرة من الفطريات المجهرية.',1,[SOURCES.micro]),
  q('microorganism-life-processes','athletes-foot','trueFalse','قد تسبب بعض الفطريات المجهرية مرض القدم الرياضي.',['صح','خطأ'],'صح','بعض الفطريات المجهرية تسبب التهابات جلدية منها القدم الرياضي.',1,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','binary-fission','choice','ما طريقة التكاثر اللاجنسي الشائعة في معظم البكتيريا؟',['الانشطار الثنائي','التلقيح','الإخصاب الخارجي','النتح'],'الانشطار الثنائي','تتكاثر معظم البكتيريا بالانشطار الثنائي.',1,[SOURCES.micro]),
  q('microorganism-life-processes','budding','choice','أي مخلوق مجهري يتكاثر لاجنسيًا بالتبرعم؟',['الخميرة','بكتيريا إي كولاي','البراميسيوم فقط','الدياتومات فقط'],'الخميرة','تتكاثر بعض الفطريات ومنها الخميرة بالتبرعم.',2,[SOURCES.micro]),
  q('microorganism-life-processes','conjugation','choice','ما العملية الجنسية التي تتبادل فيها مخلوقات حية دقيقة المادة الوراثية قبل أن تنفصل؟',['الاقتران','الانشطار الثنائي','التبرعم','النتح'],'الاقتران','في الاقتران تتبادل المخلوقات الحية الدقيقة المادة الوراثية.',2,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','bread-mold','choice','ما عفن الخبز؟',['فطر','بكتيريا','نبات','حيوان'],'فطر','عفن الخبز نوع من الفطريات.',1,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','bread-mold-enzymes','choice','أي تركيب في عفن الخبز يفرز مواد تساعده على امتصاص الغذاء؟',['الخيوط الفطرية','الأوراق','الجذور الحقيقية','الثغور'],'الخيوط الفطرية','تفرز بعض الخيوط الفطرية إنزيمات تسهل امتصاص الغذاء.',2,[SOURCES.micro,SOURCES.exam]),
  q('microorganism-life-processes','microbe-reproduction','trueFalse','جميع المخلوقات الحية الدقيقة تتكاثر لاجنسيًا فقط.',['صح','خطأ'],'خطأ','بعض المخلوقات الحية الدقيقة تتكاثر جنسيًا أيضًا، مثل الاقتران.',2,[SOURCES.micro,SOURCES.exam])
]);
