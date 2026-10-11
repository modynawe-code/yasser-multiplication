# سجل تنفيذ وتحقق تفاعل مونوبولي

المرجع: INTERACTION-AGREEMENT.md. جميع البنود منفذة في الكود؛ لا تعني هذه العبارة أنها مختبرة على الأجهزة الحقيقية.

| المتطلبات | مسار التنفيذ | دليل التحقق الحالي |
|---|---|---|
| DICE-01…05 | monopoly-interaction.js / .css | اختبار الأوجه الستة والاتجاه الصحيح؛ التحقق البصري والسحب والصوت ينتظر تجربة المتصفح |
| MOVE-01…02 | monopoly-controller.js / monopoly-interaction.css | إصلاح selector وإزالة انتظار 1300ms؛ حركة المتصفح قيد التحقق |
| CAMERA-01…04 | monopoly-interaction.js / .css | اختبار حدود التقريب/الإزاحة؛ إيماءات الأجهزة الحقيقية لم تختبر |
| CARD-01…03 | monopoly-engine.js / controller / backend rules | اختبار deck → back → face → apply، وعدم الخصم المبكر والتكرار ومنع اللاعب الآخر |
| MONEY-01…03 | presentTransition / interaction.money | اختبارات إيصالات الرصيد؛ تأثير انتقال المبلغ والصوت قيد التحقق البصري |
| OWN-01…02 | interaction.ownership / renderBoard | اختبارات شراء/إيجار/منازل/فندق؛ حركة ظهور البناء قيد التحقق |
| TURN-01 / END-01 | interaction.announce | إعلان دور وفوز وإفلاس مع صوت مختلف؛ العرض قيد التحقق |
| TRADE-01…02 | proposeMonopolyTrade / respondMonopolyTrade / backend | اختبار عدم الانتقال قبل القبول، الرفض، منع المرسل، إعادة التحقق، ومنع المدخلات غير الصحيحة |
| UI-01…02 | monopoly-interaction.css / install | طبقة ساحة مستقلة عن تحويل البورد؛ مراجعة المتصفح قيد التحقق |
| ONLINE-01…03 | handleOnlineRoom / presentation.sequence / backend rules | اختبارات سلطة الخادم ومراحل البطاقات؛ اختبار طرفين فعلي قيد التحقق |
| A11Y-01 | button/ARIA/reduced-motion | أزرار HTML وإعلانات role=status، مسار تقليل الحركة؛ تجربة قارئ الشاشة لم تختبر |
| SAFE-01 | transitionGeneration / interaction.cancel | إلغاء WAAPI ومصادر الصوت والانتقالات عند المغادرة/إعادة الجولة؛ تحقق متصفح قيد التنفيذ |

## حدود الاختبار
- اختبارات frontend: 801 ناجحة.
- اختبارات backend: 54 ناجحة.
- Android/iPhone/iPad/Galaxy Tab الفعلية: غير مختبرة من هذه البيئة.
- قبل إطلاق ادعاء اكتمال التجربة: يلزم تحقق بصري للمتصفح، وتجربة صاحب التطبيق للصوت واللمس على أجهزته.

## الرجوع
نسخة ما قبل تعديل مونوبولي: e08f9b583cd9a479981768c9641662896d3f599a. الرجوع يتم بcommit يعكس تغييرات هذه الدفعة، دون force push ودون تعديل باقي التطبيق. الخادم والواجهة يرجعان معًا بسبب مراحل البطاقة وموافقة التبادل.
