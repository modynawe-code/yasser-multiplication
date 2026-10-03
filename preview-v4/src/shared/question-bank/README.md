# Shared Question Bank

قاعدة بيانات محلية موحدة للأسئلة يمكن استخدامها في العلوم والرياضيات ولغتي والإنجليزي وغيرها بدون ربط المنطق بمادة واحدة.

## Question record

كل سؤال يحمل مساره في المنهج (`subjectId → gradeId → termId → unitId → chapterId → lessonId/topicId → conceptId`) مع نوع السؤال وصعوبته والإجابة والمصدر.

المصادر تحفظ مع السؤال حتى يمكن التحقق من الأصل والسنة ونوع الاختبار، ويدعم السجل أكثر من مصدر للسؤال نفسه. `verified` لا يعني أن المصدر رسمي؛ بل يعني أن السؤال وإجابته راجعهما المشروع.

## Source authority

`official`, `regional-exam`, `school-exam`, `teacher-model`, `training-model`, `worksheet`, `textbook`, `study-summary`, `user-upload`, `unknown`.

## Usage

- `createQuestionRecord()` لإنشاء سجل موحد.
- `createQuestionBank()` لبناء بنك والتحقق من سلامته.
- `queryQuestionBank()` لاستخراج أسئلة مادة/وحدة/فصل/نوع/مصدر.
- `findExactQuestionDuplicates()` لاكتشاف النسخ المكررة نصيًا بعد التطبيع.
- `getQuestionBankCoverage()` لمعرفة تغطية البنك قبل بناء اختبار أو إضافة أسئلة.

يبقى عرض الأسئلة وطريقة الاختبار منفصلين عن البنك؛ لذلك يمكن إعادة استخدام البيانات في أنشطة واختبارات مختلفة أو نقلها لاحقًا إلى SQLite/Supabase دون تغيير نموذج المحتوى.
