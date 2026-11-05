# Monopoly TV — ملاحظات المراجعة البصرية

تاريخ المراجعة: 2026-11-05  
الحالة: ملاحظات أولية من صور المستخدم؛ لم تُعتمد بصريًا ولم تُنفذ بعد.  
المصادر: لقطة يد التحكم أثناء اللعب بلاعب كمبيوتر، وصورتان متقاربتان لشاشة التلفزيون في حالة عرض ملكية متاحة للشراء.

## الملاحظات المرئية

1. **مقروئية اللوحة:** الطاولة تشغل معظم ارتفاع شاشة التلفزيون، لكن أسماء الخانات والأسعار صغيرة. المطلوب تحسين أصل اللوحة/رسم النصوص بدقة وحجم أوضح، مع الحفاظ على الخانات الأربعين وترتيبها.
2. **عمق المشهد:** منظور الطاولة موجود، لكن اللوحة تبدو إلى حد كبير كصورة مطبوعة فوق السطح. بروز الخانات وسماكتها وخامة الخشب والظلال تحتاج مراجعة بصرية.
3. **تتابع الكاميرا والأحداث:** بطاقة الحدث تظهر في الوسط؛ الصور لا توضح إبراز خانة الوصول قبل البطاقة ثم العودة للوحة. يلزم فحص تسلسل الحركة على المشهد الفعلي.
4. **تصميم بطاقة الحدث:** رمز البيت إيموجي غير متناسق مع المجسمات، والشريط الملون أعلى البطاقة لا يوضح وظيفته. استخدم أصلًا بصريًا متسقًا، واربط الشريط بمؤقت/حركة معلنة أو احذفه.
5. **يد التحكم:** حالة «اللاعب التجريبي يلعب تلقائيًا» تظهر بأسلوب زر معطّل؛ اعرضها كحالة تلقائية واضحة. لقطة الواجهة بعرض ضيق على شاشة كبيرة قد تكون طبيعية لواجهة الجوال؛ يلزم تأكيد شكلها على هاتف فعلي قبل تعديل عرضها.

## ملاحظات إضافية من صور التلفزيون الفعلية

6. **حجم اللوحة داخل الشاشة:** اللوحة صغيرة نسبيًا مقارنة بمساحة التلفزيون، والجانبان يستهلكان مساحة ملحوظة. راجع تركيب العرض على التلفزيون، وقلّص معلومات HUD أثناء اللعب مع إبقاء الدور واللاعب والرصيد المهم واضحًا.
7. **هوامش صورة اللوحة:** تظهر حواف فاتحة واسعة حول الخانات المطبوعة، خصوصًا أسفل اللوحة وجوانبها. افحص أصل الصورة واقتصاصها كي تستفيد الخانات من مساحة الطاولة دون قص أي خانة.
8. **النرد بعد الرمية:** في حالة الوصول إلى محطة المدينة تظهر النتيجة 5 و1 كمربعات رقمية مسطحة داخل بطاقة الحدث، بينما النرد ثلاثي الأبعاد غير ظاهر في هذه اللقطة. راجع انتقال النتيجة إلى الحالة المستقرة؛ المطلوب الحفاظ على نتيجة الخادم وإظهار إخراج متسق مع النرد ثلاثي الأبعاد.
9. **تحديد الخانة والقطع:** في زاوية الصورة، القطع وإطار تمييز الخانة قريبون من بعض الخانات المجاورة. لا يُسجل هذا كخلل مؤكد من الصورة؛ يلزم التحقق من إسقاط الخانة النشطة ومواقع القطع وحدود الملكية في المشهد ثلاثي الأبعاد.
10. **ملء شاشة التلفزيون:** شريط المتصفح ظاهر أعلى الشاشة ويقلل المساحة المتاحة. اختبر وضع ملء الشاشة/تطبيق التلفزيون النهائي، واضبط المشهد على مساحة العرض الفعلية بدون قص اللوحة أو الـHUD.

## بوابة التحقق

- صور قبل/بعد على 1080p و4K إن توفر، مع مراجعة الانتظار واللعب وحدث الملكية.
- فحص مقروئية أسماء الخانات والأسعار من مسافة مشاهدة التلفزيون.
- التحقق من بروز الخانات ومواضع القطع والنرد، وتسلسل الكاميرا، ووضوح بطاقة الحدث، وحركة لاعب الكمبيوتر.
- إعادة الاختبار في وضع ملء الشاشة على التلفزيون الفعلي؛ الصور المرفقة تثبت شكل العرض المصوّر ولا تثبت أداء Android TV.
- عدم اعتبار هذه الملاحظات موافقة نهائية، وعدم تغيير قواعد اللعبة أو صلاحياتها.
- لا نشر على main؛ التطوير والاختبار على Staging فقط.

## Visual fix checkpoint — 2026-11-05
- Updated only the TV renderer/layout. The 7.1% non-playable scan border is cropped from the Three.js texture and fallback artwork; the 40-cell grid and raised tile meshes now share that full-size coordinate space. This increases playable ring scale by about 16.5% without changing tile order or game state.
- Replaced the scan's tiny baked tile labels on raised Three.js tiles with crisp RTL canvas labels from the existing 40-cell DOM data. The icon/color strip remains visible above the label band; prices stay sourced from the existing board data.
- Moved the four pawn slots to the outside edge for each board side and reduced token scale to 0.60, so tokens sit away from the center label/icon area while staying within their tile.
- Three.js dice now settle on the felt around the event card and stay visible through the landing event; flat duplicate dice are hidden only when Three.js board rendering is active. Results still come from the existing server state. Reduced the TV board's viewport/width reserves slightly; no phone CSS or game rules changed.
- Local validation: renderer contract, family Monopoly and room tests **47/47 passed**; `node --check` passed for the renderer and TV entry; `git diff --check` passed. Local bundling could not run because this worktree has no installed `esbuild`; CI build and deployed screenshots are the next acceptance gate.
- Not yet visually accepted: confirm cropped raised tiles line up in Chromium/WebKit screenshots, event dice are not covered by the card, 720p/1080p readability, and actual 50-inch TV view. Keep this branch/Staging-only; do not merge to main.

## Follow-up for TV polish notes — 2026-11-05
- Added a user-gesture fullscreen control with Safari-prefixed fallback so the TV browser chrome can be hidden where supported; existing overview-camera control remains separate.
- Replaced the property card's multicolor house emoji with a consistent single-color SVG mark and removed the unexplained colored stripe. Kept the server's action/event text unchanged.
- The demo opponent remains disabled after joining, but now has a clear green automatic-player state instead of looking broken or unavailable.
- Adjusted the board's viewport reserve and table gap based on the 720p/1080p CI measurements, to keep the tabletop in bounds and its outer 3D rim clear of side rails.
- Validation for this follow-up is pending after the current staging workflow completes; do not treat these changes as published until a matching staging release is confirmed.
