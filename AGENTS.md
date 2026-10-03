# Project

هذا هو تطبيق ياسر وخالد ومشاعل التعليمي العائلي.

المشروع الحالي هو الأساس ولا يعاد بناؤه من الصفر.

## Engineering

- Preserve what works.
- افهم Root Cause قبل التعديل.
- استخدم أصغر تغيير آمن يعالج السبب الحقيقي.
- لا تعمل Refactor غير مرتبط بالمشكلة الحالية.
- لا تغير Framework أو Stack بدون سبب مثبت.
- لا تضف مكتبات كبيرة بدون ضرورة.
- لا تكرر المنطق إذا كانت المسؤولية فعلًا مشتركة.
- استخدم configuration/data للاختلافات بين الأطفال عندما يكون ذلك مناسبًا.
- لا تعمل abstractions لمجرد التشابه الشكلي.
- حافظ على قابلية إضافة أطفال وألعاب وأنشطة وجوائز مستقبلًا.
- لا تكسر إمكانية تحويل المشروع مستقبلًا إلى PWA/APK.

## Product / UI / UX

الأولوية الأساسية للتجربة هي Samsung Galaxy Tab:

- Landscape
- Portrait

مع الحفاظ على Mobile وDesktop.

التصميم النهائي يجب أن يكون:

- professional
- intentional
- child-friendly
- coherent
- responsive

ويجب ألا يبدو:

- AI-generated
- generic template
- random cards
- random gradients
- patchwork UI

## Graphics

- استخدم الجرافيكس الموجودة عالية الجودة عندما تكون مناسبة.
- لا تستخدم Emoji أو SVG بدائي أو CSS illustration كبديل نهائي لجرافيكس احترافية مطلوبة.
- إذا كان Asset مهم مفقودًا، أنشئ Asset Contract بدل اختراع بديل رديء.
- حافظ على هوية ياسر وخالد ومشاعل وعدم خلط الشخصيات.

## Architecture

الهدف:

`Shared platform + configurable child identities`

وليس:

`Three duplicated applications`

شارك المنطق عندما يكون مشتركًا فعلًا، واترك الاختلافات الخاصة بكل طفل منفصلة عندما يلزم.

## Validation

لا تعتبر التعديل ناجحًا لمجرد أن الكود يعمل أو CSS يبني.

تحقق بالمستوى المناسب من:

- Functional behavior
- Regression
- Responsive behavior
- Visual result
- Accessibility
- Performance

لا تدّع اختبار شيء لم يتم اختباره فعليًا.

## Git Safety

- لا تستخدم force push.
- لا تستخدم destructive reset.
- لا تحذف تغييرات المستخدم.
- لا تعدل فروع أخرى.
- هذه الجلسة تعمل فقط على `feature/product-ui-reference-v1`.
- حافظ على rollback path.

## Codex Efficiency

- لا تعيد قراءة الملفات التي تم فهمها ما لم تتغير.
- استخدم targeted inspection بدل الفحص الشامل المتكرر.
- استخدم targeted tests أولًا.
- لا تشغل full test suite أو build بشكل متكرر بدون سبب.
- لا تستخدم عدة Agents لنفس المهمة.
- لا تعمل بحثًا خارجيًا إلا عند الحاجة الفعلية.
- لا تنتج تقارير طويلة إذا كان المطلوب يمكن حسمه وتنفيذه مباشرة.

## Permanent Principle

`Context → Evidence → Root Cause → Smallest Safe Solution → Implementation → Validation`
