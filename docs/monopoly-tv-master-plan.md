# مونوبولي — خطة التنفيذ الرئيسية لوضع التلفزيون والجوالات

**الحالة:** PLAN / NOT IMPLEMENTED.  
**فرع العمل:** `feature/monopoly-tv-multiscreen-v1`.  
**النسخة المرجعية:** `main@760ae01f2f690bbcabddd3d7552448e0f6da9a56`.  
**المبدأ:** تعديل تدريجي يحافظ على نسخة مونوبولي الأساسية وجميع قواعد اللعبة وسجلاتها. لا نشر إلى `main` قبل اختبارات القبول.

## النتيجة المطلوبة

شاشة Android TV مقاس 50 بوصة تعرض الطاولة كاملة، وتستقبل أوامر 2–4 لاعبين من جوالاتهم عبر صفحة مخصصة لكل لاعب، مع مشاهد حركية ممتعة للصوت والكاميرا والنرد والأملاك، وتحكم خاص في الأوامر والحالة من الخادم. لا حساب أو تطبيق على جوال اللاعب. واجهة اللعبة الحالية تبقى متاحة ومستقلة.

## مراجعة الحالة الحالية (confirmed in source)

- قواعد مونوبولي الحالية: `preview-v4/src/modules/games/monopoly/monopoly-engine.js`.
- الواجهة والتفاعل والكاميرا: `monopoly-controller.js`, `monopoly-interaction.js`, `monopoly-interaction.css`, `monopoly-scene.js`.
- جلسة الغرفة: `monopoly-online-session.js` فوق `games/online/game-online-session.js`. هناك `player` و`spectator` وأرقام إصدارات للغرف، وتحديث دوري كل 1100ms تقريبًا.
- API والسلطة على الغرف: `backend/src/game-rooms.mjs`, `backend/src/game-room-rules.mjs` وD1، مع تحكم بالأدوار ورموز خاصة بكل مشارك.
- Cloudflare Worker وD1 وGitHub Pages موجودة. لا يتم تعديل أو تشغيل migrations الإنتاجية بدون نسخة احتياطية وموافقة صريحة.
- أدوات QA وPlaywright ومهارات الألعاب متوفرة في `.agents/skills/`.
- **غير موجود بعد:** وضع تلفزيون/يد تحكم مخصص؛ لذا لا نعتمد على أن `spectator` الحالي وحده يحقق فصل TV/Phone بصورة آمنة.

## القواعد الثابتة

- [ ] لا نكرر محرك القواعد على الجوال أو التلفزيون. الخادم صاحب القرار النهائي، وتقدم اللقطات `stateVersion` و`eventId`.
- [ ] لا تُعرض رموز اللاعبين الخاصة أو معلومات الجوال الحساسة في QR؛ الرمز يحوي رابط الدخول ورقم غرفة مؤقتًا فقط.
- [ ] التلفزيون لا يرسل أوامر مالك اللاعب. له دور عرض مستقل/محدود، مع تحكم إداري مضبوط في بدء/إنهاء المشهد.
- [ ] ما فيه مشتريات أو اشتراكات مفروضة. راقب حدود Cloudflare Free قبل تفعيل وظائف جديدة.
- [ ] عدم تغيير مسارات الأطفال أو المحتوى القرآني أو الألعاب الأخرى.
- [ ] فصل `GameState` عن `PresentationEvent` وعن `AnimationTimeline` وعن `ControllerInput`.
- [ ] اختبارات `unit/integration/E2E/visual/performance/security/recovery` قبل نشر `main`.
- [ ] لا تنتقل علامة [x] إلى مهمة إلا برابط commit ونتيجة اختبار، والتجربة الفعلية لا تُعتمد بمحاكاة متصفح فقط.

## مراحل العمل وقائمة القبول

### 0 — Baseline، القياس، الاسترجاع
- [ ] جرد أكواد اللعبة والاعتماديات وأماكن حفظ الغرفة، الفروع والتغييرات المفتوحة.
- [ ] لقطة مرجعية للحركة والأصوات والكاميرا وواجهة الجوال/تابلت.
- [ ] اختبارات تغطي لعبة كلاسيكية كاملة: رمي/شراء/رفض/مزاد/إيجار/مجموعة/بيت/فندق/رهن (إن كان مدعومًا)/بيع/تبادل/فرصة/جماعة/سجن/إفلاس/فوز. ما لا يدعمه المحرك يُحدد بوضوح قبل الإعلان.
- [ ] فرع احتياطي وrollback للإصدار الحالي، مراجعة الأمن والحدود والتكلفة.
**Gate:** جميع اختبارات الحالة الحالية ناجحة؛ سجل Known Issues محفوظ.

### 1 — TV Host + Pairing (الشريحة الوظيفية الأولى)
- [ ] مسار مستقل مثل `/monopoly/tv` (أو hash route وفق بنية المشروع)، بوضع ملء الشاشة 16:9، بدون ظهور أزرار لاعب.
- [ ] مسار `/monopoly/controller` للجوال، RTL مع safe areas، وزر عودة واضح.
- [ ] إنشاء/الانضمام لغرفة من التلفزيون أو هاتف مضيف وفق صلاحيات مستقلة؛ QR ورمز 6 خانات واسم لاعب واضح.
- [ ] ربط 2–4 جوالات وهوية اللاعب ولون القطعة وحالة انتظار/جاهز.
- [ ] TV guest/viewer لا يشغل player seat ولا يكشف `playerToken`.
- [ ] إرسال snapshot صحيح عند فتح/تحديث أي شاشة، وإظهار حالة الاتصال وإمكانية استعادة الجلسة.
**Gate:** تلفزيون وجوالان في الغرفة نفسها؛ وصول الحالة والهوية بلا خلط أو تسريب صلاحية.

### 2 — Controller UI + action protocol
- [ ] واجهة خاصة باللاعب: دورك/انتظار، رصيد، أملاكك، الأوامر المسموحة فقط.
- [ ] تحكم بالنرد بالسحب، زر بديل ونظام صوتي/بصري مناسب iPhone (لا نعتمد على vibration في Safari).
- [ ] شراء، رفض/مزاد، إيجار، بناء، بيع، رهن وفك الرهن إذا كانت قواعد المحرك تدعمها، تداول بعرض/قبول/رفض، فرصة/جماعة، السجن والضرائب، النهاية.
- [ ] `requestId` فريد لكل فعل، `expectedVersion`، رفض الأفعال المكررة والقديمة والتصرف خارج الدور.
- [ ] Pending UI وتعطيل الضغط المتكرر، وإشعار واضح لرفض العملية وإعادة المزامنة.
- [ ] تحويل الشاشة تلقائيًا حسب المرحلة، مع عدم كشف معلومات محمية للاعبين الآخرين.
**Gate:** إكمال جولة من جوالين فقط بدون لمس التلفزيون، والتحقق من صحة المال والملكية والإيجار على الخادم.

### 3 — مزامنة قوية واسترجاع الغرف
- [ ] قياس زمن انتشار أحداث D1 polling الحالي مع 2–4 لاعبين.
- [ ] اختيار transport حسب القياس. إن لم تكفِ الاستجابة: `Cloudflare Durable Objects (SQLite) + WebSocket Hibernation` للغرفة الواحدة، مع بقاء القواعد وإمكان D1 للبيانات الملائمة.
- [ ] server-authoritative transitions، `stateVersion`, `eventId`, `ack`, replay/snapshot، idempotency، ordering، permissions.
- [ ] reconnect مع exponential backoff وحد أقصى وتبديل الشبكة، دون ضياع الدور أو تكرار عمليات المال.
- [ ] استعادة التلفزيون وغرفة اللعب بعد refresh وإغلاق التطبيق مؤقتًا، وسياسة انتهاء/تجديد الغرف وتحويل المضيف.
- [ ] rate limit والحد من guessing والغرف الزائفة وعدم إرسال tokens للعرض العام.
- [ ] staging backend منفصل عن production + اختبارات migrations وrollback مع نسخة احتياطية.
**Gate:** إيقاف جوال/تلفزيون أثناء الشراء ثم العودة، مع تطابق الحالة وعدم تكرار الخصم أو الحدث.

### 4 — سينما اللعبة TV Presentation
- [ ] لوحة 16:9 واضحة عالية الدقة وذات مقروئية من مسافة المشاهدة.
- [ ] بناء Render Adapter منفصل: نبدأ بما يعمل حاليًا ونقيس؛ PixiJS/WebGL فقط إذا حسّن أداء/دقة المشهد بالفعل.
- [ ] Animation Director للأحداث: idle overview → dice windup/throw → follow token on every step → landing focus → card/ownership event → overview.
- [ ] Camera safe zones لتجنب حجب القطعة ببطاقات الحدث. بطاقة الملكية/الإيجار بحجم متناسب مع التلفزيون وغير مزدحمة.
- [ ] نرد ثنائي، قطع واضحة اللون ومكان اللاعب، بيوت وفندق يظهران فوق الملكية الصحيحة، دخول السجن، فرصة/جماعة، شراء/إيجار/أموال.
- [ ] دمج صوت النرد والحركة والشراء والإيجار والمزاد والسجن/الفوز (خيارات كتم/صوت)، احترام تقليل الحركة.
- [ ] لا تعتمد حركة المشهد على أي تغيير مالي أو قانوني؛ animation failure لا يغير حالة اللعب.
- [ ] اختبار 1080p أولًا، قياس FPS وframe time والذاكرة، و4K فقط إن أثبت الجهاز القدرة، وضع جودة منخفضة تلقائي.
**Gate:** عدة دورات تصوير من كل جهة، بطاقة واضحة، بدون تقطع ملحوظ أو تسرب موارد، مع نفس القواعد.

### 5 — Android TV وملف APK
- [ ] تجربة TV Web أولًا على التلفزيون الفعلي، ثم اختيار wrapper خفيف إذا احتجناه.
- [ ] توفير عنصر تشغيل وظهور في واجهة Android TV وD-pad للتنقل/رجوع/خروج مع اتصال الجوالات.
- [ ] التكيف مع overscan، HDMI/60Hz، تغيير الدقة واتصال Wi-Fi، وإيقاف مؤقت عند sleep/return.
- [ ] تبويب معلومات الشبكة وحالة الاتصال، عدم السماح بإيقاظ/تسريب واجهات الجوال على التلفزيون.
- [ ] APK منفصل عن نسخة الأطفال، إصدار وتحديث واختبار تثبيت/إلغاء دون حذف البيانات على الخادم.
**Gate:** تشغيل التطبيق على شاشة المستخدم 50 بوصة مع الريموت وجوالات اللاعبين؛ اختبار أداء وعرض فعلي.

### 6 — End-to-end QA، إغلاق وإطلاق
- [ ] سيناريوهات 2/3/4 لاعبين، تكرار جولات، مزاد، رهن، تبادل، بيت وفندق، السجن، الإفلاس، انتهاء اللعبة.
- [ ] Controller iPhone Safari + Android Chrome + TV Chrome/WebView حسب توفر الجهاز.
- [ ] سياسات فشل: انقطاع WebSocket، تغيير Wi-Fi، فقد الهاتف، سقوط TV، refresh متزامن، تكرار الرسائل، لايوجد لاعب حاضر.
- [ ] فحص RTL والنصوص ومساحات النقر ووضع ملء الشاشة وإمكانية الوصول وreduced motion.
- [ ] مراقبة أخطاء backend، أرقام الإصدارات، أداء TV ووقت الاتصال، دون تسجيل tokens أو بيانات حساسة.
- [ ] إصدار تجريبي منعزل، مراجعة يدوية، قبول المستخدم، ثم merge إلى main ونشر رابط أساسي والتحقق من الإصدار الفعلي.
- [ ] توثيق Known Issues والاختبارات الناجحة والغير منفذة ومسار العودة للإصدار السابق.
**Gate:** نشر مع سجل أدلة ونتائج، وليس الاكتفاء بعبارة «نجح محليًا».

## UI scenes required (do not forget)
- [ ] Lobby on TV: join QR, 6-digit code, seats, player colors, connection badges.
- [ ] Controller lobby: pairing, readiness, name, reconnect UI.
- [ ] Turn ownership: sound + highlight + "your turn" on phone.
- [ ] Dice gesture and fallback button; engine verifies valid roll.
- [ ] Move token: every tile, turns/corners, precise ownership and building alignment.
- [ ] Arrival: readable TV card, phone action, synchronized close.
- [ ] Chance/Community: draw, reveal, outcome, continue.
- [ ] Cash/rent/tax/payments: visible and coherent changes.
- [ ] Buy/auction and trade confirmations, no double submit.
- [ ] Property overview and buildings: houses, hotel, mortgage state and other players.
- [ ] Jail and bankruptcy: camera effects and correct engine behavior.
- [ ] Winner/ending, replay, leave room, host transfer, disconnected player.
- [ ] Music/sound levels, mute, accessibility and reduced-motion option.

## Engineering boundaries
Primary: Architecture/System Design and Game Client Engineering.  
Secondary: Backend/API, Networking, Data, Security, UI/UX, Animation, Performance, Accessibility, QA, Android TV, DevOps.

- **Do not** rewrite the Monopoly engine or mix 3D engine into business rules.
- **Do not** add PixiJS/GSAP just to check a box. Compare on real board render quality and measurements first.
- **Do not** migrate production D1 schema or activate billable services without checking limits/backups.
- **Do not** mark a stage complete without passing its gate and linking evidence.

## Execution log

| Date | Stage | Work | Commit / QA | State |
|---|---|---|---|---|
| 2026-11-03 | Planning | Verified current engine, D1 rooms, polling and skills; created tracked roadmap | this file | Planned, not implemented |

**Next executable step:** Stage 0 baseline and Stage 1 vertical slice: join one TV viewer and two phone controllers to one room, verify role boundary, then deterministic dice action from phone and render on TV. Keep existing UI routes untouched.
