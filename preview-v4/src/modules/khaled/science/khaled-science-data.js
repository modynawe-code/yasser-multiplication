const a=(x,y,width,height,labelAr)=>Object.freeze({x,y,width,height,labelAr});

// Exact artwork crops from the supplied Grade 1 Science Term 1 worksheet PDF.
// One shared sprite is used so the original worksheet drawings stay visually identical.
export const KHALED_SCIENCE_ART=Object.freeze({
  air:a(7,26,95,88,'الهواء'),bird:a(112,29,105,82,'عصفور'),bread:a(234,32,82,75,'خبز'),candy:a(340,23,90,94,'حلوى'),
  car:a(450,25,90,90,'سيارة'),cat:a(560,2,90,136,'قطة'),chair:a(674,11,82,117,'كرسي'),child:a(793,10,63,120,'طفل'),
  flower:a(8,155,94,110,'زهرة'),flowerPot:a(121,140,87,140,'نبات مزهر'),food:a(231,163,87,94,'طعام'),gamepad:a(340,176,90,67,'لعبة'),
  glass:a(457,172,76,75,'ماء'),leaf:a(557,155,96,110,'ورقة'),reviewBird:a(666,169,97,82,'عصفور'),reviewCandy:a(780,173,90,74,'حلوى'),
  reviewCar:a(11,311,87,78,'سيارة'),reviewCat:a(120,314,90,71,'قطة'),reviewChair:a(233,309,83,82,'كرسي'),reviewRock:a(340,309,90,82,'صخرة'),
  reviewSun:a(452,309,86,82,'ضوء الشمس'),reviewTree:a(560,308,90,83,'شجرة'),rock:a(677,294,75,112,'صخرة'),root:a(780,290,90,120,'الجذور'),
  soil:a(4,447,101,86,'التربة'),stem:a(120,431,90,118,'الساق'),sun:a(230,438,90,104,'ضوء الشمس'),sunNeed:a(335,438,100,103,'ضوء الشمس'),
  tree:a(447,441,95,97,'شجرة'),tv:a(558,439,93,101,'تلفاز'),water:a(672,439,86,102,'الماء'),wateringCan:a(778,443,93,93,'مرش ماء')
});

const option=(id,art,labelAr)=>Object.freeze({id,art,labelAr});

export const KHALED_SCIENCE_LESSONS=Object.freeze([
  Object.freeze({
    id:'living-things',chapter:'الفصل الأول',title:'المخلوقات الحية',sourcePages:Object.freeze([2]),
    activities:Object.freeze([
      Object.freeze({id:'living-select',type:'multi',prompt:'ضع دائرة حول المخلوقات الحية.',spokenPrompt:'اختر المخلوقات الحية.',options:Object.freeze([
        option('rock','rock','صخرة'),option('cat','cat','قطة'),option('chair','chair','كرسي'),option('flower','flowerPot','نبات')
      ]),correct:Object.freeze(['cat','flower']),sourcePage:2}),
      Object.freeze({id:'living-match',type:'matching',prompt:'صل المخلوق الحي بما يناسبه.',spokenPrompt:'صل كل كلمة بالصورة المناسبة.',pairs:Object.freeze([
        Object.freeze({left:'شجرة',right:'tree',art:'tree'}),Object.freeze({left:'عصفور',right:'bird',art:'bird'}),Object.freeze({left:'طفل',right:'child',art:'child'})
      ]),sourcePage:2}),
      Object.freeze({id:'plants-living',type:'truefalse',prompt:'النباتات مخلوقات حية.',spokenPrompt:'هل النباتات مخلوقات حية؟',correct:true,sourcePage:2}),
      Object.freeze({id:'rock-living',type:'truefalse',prompt:'الصخرة مخلوق حي.',spokenPrompt:'هل الصخرة مخلوق حي؟',correct:false,sourcePage:2}),
      Object.freeze({id:'animals-needs',type:'multi',prompt:'الحيوانات تحتاج إلى ماذا؟ اختر كل ما ينطبق.',spokenPrompt:'اختر ما تحتاج إليه الحيوانات.',options:Object.freeze([
        option('water','water','ماء'),option('food','food','طعام'),option('sun','sun','ضوء الشمس'),option('car','car','سيارة')
      ]),correct:Object.freeze(['water','food']),sourcePage:2}),
      Object.freeze({id:'plants-needs',type:'multi',prompt:'النباتات إلى ماذا تحتاج لتنمو؟ اختر كل ما ينطبق.',spokenPrompt:'اختر ما تحتاج إليه النباتات لتنمو.',options:Object.freeze([
        option('air','air','هواء'),option('soil','soil','تربة'),option('sun','sunNeed','ضوء الشمس'),option('candy','candy','حلوى'),option('tv','tv','تلفاز')
      ]),correct:Object.freeze(['air','soil','sun']),sourcePage:2})
    ])
  }),
  Object.freeze({
    id:'plant-parts',chapter:'الفصل الأول',title:'النباتات وأجزاؤها',sourcePages:Object.freeze([3]),
    activities:Object.freeze([
      Object.freeze({id:'parts-match',type:'matching',prompt:'صل كل جزء من النبات بوظيفته المناسبة.',spokenPrompt:'صل كل جزء من النبات بوظيفته.',pairs:Object.freeze([
        Object.freeze({left:'الجذور',leftArt:'root',right:'roots-function',rightLabel:'تثبت النبات في التربة'}),
        Object.freeze({left:'الساق',leftArt:'stem',right:'stem-function',rightLabel:'تحمل الأوراق والأزهار'}),
        Object.freeze({left:'الأوراق',leftArt:'leaf',right:'leaf-function',rightLabel:'تصنع الغذاء للنبات'}),
        Object.freeze({left:'الأزهار',leftArt:'flower',right:'flower-function',rightLabel:'تكوّن البذور'})
      ]),sourcePage:3}),
      Object.freeze({id:'leaf-makes-food',type:'single',prompt:'أي جزء من النبات يصنع الغذاء للنبات؟',spokenPrompt:'اختر الجزء الذي يصنع الغذاء للنبات.',options:Object.freeze([
        option('root','root','الجذور'),option('leaf','leaf','الأوراق'),option('flower','flower','الأزهار')
      ]),correct:'leaf',sourcePage:3}),
      Object.freeze({id:'roots-in-soil',type:'truefalse',prompt:'تنمو الجذور في التربة.',spokenPrompt:'هل تنمو الجذور في التربة؟',correct:true,sourcePage:3}),
      Object.freeze({id:'leaves-dont-help',type:'truefalse',prompt:'الأوراق لا تساعد النبات على صنع غذائه.',spokenPrompt:'هل الأوراق لا تساعد النبات على صنع غذائه؟',correct:false,sourcePage:3}),
      Object.freeze({id:'stem-holds',type:'single',prompt:'ما الجزء الذي يحمل الأوراق والأزهار؟',spokenPrompt:'اختر الجزء الذي يحمل الأوراق والأزهار.',options:Object.freeze([
        option('leaf','leaf','الأوراق'),option('stem','stem','الساق'),option('root','root','الجذور')
      ]),correct:'stem',sourcePage:3}),
      Object.freeze({id:'flower-seeds',type:'single',prompt:'ما الجزء الذي تتكوّن فيه البذور؟',spokenPrompt:'اختر الجزء الذي تتكون فيه البذور.',options:Object.freeze([
        option('flower','flower','الأزهار'),option('leaf','leaf','الأوراق'),option('root','root','الجذور')
      ]),correct:'flower',sourcePage:3})
    ])
  })
]);

export const KHALED_SCIENCE_ACTIVITY_COUNT=KHALED_SCIENCE_LESSONS.reduce((sum,lesson)=>sum+lesson.activities.length,0);
export function getKhaledScienceLesson(id){return KHALED_SCIENCE_LESSONS.find(lesson=>lesson.id===id)||null;}
