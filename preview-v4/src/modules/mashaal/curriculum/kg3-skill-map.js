export const MASHAAL_KG3_SKILL_MAP = Object.freeze({
  'language-communication':Object.freeze([
    Object.freeze({id:'listen-follow-simple-directions',title:'الاستماع واتباع تعليمات بسيطة',activityTypes:Object.freeze(['listening','choice','guided-play'])}),
    Object.freeze({id:'oral-vocabulary-expression',title:'المفردات والتعبير الشفهي',activityTypes:Object.freeze(['listening','choice','story'])}),
    Object.freeze({id:'story-sequencing',title:'ترتيب أحداث قصة مصورة',activityTypes:Object.freeze(['sequencing','story'])}),
    Object.freeze({id:'sound-awareness',title:'الوعي بالأصوات وتمييزها',activityTypes:Object.freeze(['listening','matching','choice'])}),
    Object.freeze({id:'letter-sound-readiness',title:'الاستعداد لربط الحرف بصوته',activityTypes:Object.freeze(['listening','matching','choice'])}),
    Object.freeze({id:'prewriting-fine-motor',title:'الاستعداد للكتابة والمهارات الدقيقة',activityTypes:Object.freeze(['tracing','guided-play'])})
  ]),
  'cognitive-operations-general-knowledge':Object.freeze([
    Object.freeze({id:'count-and-quantity',title:'العد وربط العدد بالكمية',activityTypes:Object.freeze(['choice','matching','sorting'])}),
    Object.freeze({id:'compare-quantities',title:'المقارنة بين الكميات',activityTypes:Object.freeze(['choice','matching'])}),
    Object.freeze({id:'classify-sort',title:'التصنيف والفرز',activityTypes:Object.freeze(['sorting','drag-drop'])}),
    Object.freeze({id:'patterns',title:'اكتشاف وإكمال الأنماط',activityTypes:Object.freeze(['sequencing','choice'])}),
    Object.freeze({id:'shapes-space',title:'الأشكال والعلاقات المكانية',activityTypes:Object.freeze(['matching','drag-drop','guided-play'])}),
    Object.freeze({id:'observe-reason',title:'الملاحظة والاستنتاج وحل المشكلات البسيطة',activityTypes:Object.freeze(['choice','guided-play'])})
  ]),
  'social-emotional-development':Object.freeze([
    Object.freeze({id:'recognize-emotions',title:'التعرف على المشاعر',activityTypes:Object.freeze(['story','choice'])}),
    Object.freeze({id:'express-needs-feelings',title:'التعبير عن الاحتياجات والمشاعر',activityTypes:Object.freeze(['story','choice'])}),
    Object.freeze({id:'turn-taking-sharing',title:'الانتظار والمشاركة وتبادل الدور',activityTypes:Object.freeze(['story','guided-play'])}),
    Object.freeze({id:'seek-help-self-regulation',title:'طلب المساعدة وتنظيم الانفعال',activityTypes:Object.freeze(['story','guided-play'])})
  ]),
  'health-physical-development':Object.freeze([
    Object.freeze({id:'healthy-habits',title:'العادات الصحية والنظافة',activityTypes:Object.freeze(['sequencing','guided-play'])}),
    Object.freeze({id:'personal-safety',title:'السلامة الشخصية المناسبة للعمر',activityTypes:Object.freeze(['story','choice'])}),
    Object.freeze({id:'gross-motor',title:'المهارات الحركية الكبرى',activityTypes:Object.freeze(['guided-play'])}),
    Object.freeze({id:'fine-motor',title:'المهارات الحركية الدقيقة',activityTypes:Object.freeze(['tracing','drag-drop','guided-play'])})
  ]),
  'quran-islamic-education':Object.freeze([
    Object.freeze({id:'listen-repeat',title:'الاستماع والترديد',activityTypes:Object.freeze(['listening'])}),
    Object.freeze({id:'islamic-values-situations',title:'قيم وسلوكيات إسلامية في مواقف مناسبة للعمر',activityTypes:Object.freeze(['story','choice'])})
  ]),
  'national-social-studies':Object.freeze([
    Object.freeze({id:'family-community',title:'الأسرة والمجتمع المحيط',activityTypes:Object.freeze(['story','matching'])}),
    Object.freeze({id:'saudi-identity-belonging',title:'الهوية والانتماء الوطني المناسب للعمر',activityTypes:Object.freeze(['story','choice'])}),
    Object.freeze({id:'places-roles',title:'الأماكن والمهن والأدوار في المجتمع',activityTypes:Object.freeze(['matching','choice'])})
  ])
});

export function getMashaalKg3Skills(domainId){
  return MASHAAL_KG3_SKILL_MAP[domainId]||[];
}
