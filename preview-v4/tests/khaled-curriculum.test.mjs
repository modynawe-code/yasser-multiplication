import test from 'node:test';
import assert from 'node:assert/strict';
import { KHALED_CURRICULUM_META, getKhaledSkill, getReadyKhaledSkills } from '../src/modules/khaled/domain/curriculum.js';

test('curriculum metadata keeps current-year claim conservative',()=>{
  assert.equal(KHALED_CURRICULUM_META.grade,1);
  assert.equal(KHALED_CURRICULUM_META.locale,'ar-SA');
  assert.match(KHALED_CURRICULUM_META.verificationStatus,/pending/);
});

test('chapter one lesson structure and activity coverage are represented one-to-one',()=>{
  const skill=getKhaledSkill('classify-compare');
  assert.deepEqual(skill.lessons,['التصنيف وفق خاصية واحدة','التصنيف وفق أكثر من خاصية','يساوي','أكثر من وأقل من']);
  assert.deepEqual(skill.activityTypes,['classify-one-property','classify-two-properties','equality-groups','compare-groups']);
});

test('chapter two includes spoken numeral recognition including zero',()=>{
  const skill=getKhaledSkill('numbers-0-5');
  assert.ok(skill.lessons.includes('قراءة العدد صفر وكتابته'));
  assert.deepEqual(skill.activityTypes,['count-select','spoken-number-select']);
});

test('position and pattern structure covers the five early lessons',()=>{
  const skill=getKhaledSkill('position-pattern');
  assert.equal(skill.lessons.length,5);
  for(const lesson of ['فوق وتحت','أعلى وأوسط وأسفل','قبل وبعد','تحديد الأنماط','إنشاء الأنماط'])assert.ok(skill.lessons.includes(lesson));
});

test('chapter four maps comparison ordering and ordinal learning',()=>{
  const skill=getKhaledSkill('numbers-6-10');
  for(const lesson of ['مقارنة الأعداد حتى 10','ترتيب الأعداد حتى 10','العدد الترتيبي'])assert.ok(skill.lessons.includes(lesson));
  for(const type of ['spoken-number-select','number-compare','number-order','ordinal-select'])assert.ok(skill.activityTypes.includes(type));
});

test('chapter five maps recognition comparison and ordering through twenty',()=>{
  const skill=getKhaledSkill('numbers-11-20');
  for(const lesson of ['الأعداد 18،19،20','مقارنة الأعداد حتى 20','ترتيب الأعداد حتى 20'])assert.ok(skill.lessons.includes(lesson));
  assert.deepEqual(skill.activityTypes,['count-select','spoken-number-select','number-compare','number-order']);
});

test('chapter seven maps subtraction stories, zero and whole, and vertical subtraction',()=>{
  const skill=getKhaledSkill('subtraction-foundations');
  assert.equal(skill.chapter,7);
  assert.equal(skill.status,'ready');
  for(const lesson of ['قصص الطرح','طرح الصفر والكل','الطرح من الأعداد 10،11،12','الطرح الرأسي'])assert.ok(skill.lessons.includes(lesson));
  assert.deepEqual(skill.activityTypes,['visual-subtraction','subtraction-sentence','zero-whole-subtraction','vertical-subtraction']);
});

test('chapter eight maps the five addition and subtraction strategies one-to-one',()=>{
  const skill=getKhaledSkill('add-sub-strategies');
  assert.equal(skill.chapter,8);
  assert.deepEqual(skill.lessons,['الجمع بالعد التصاعدي','الجمع باستعمال خط الأعداد','الطرح بالعد التنازلي','أحل المسألة: أكتب جملة عددية','الطرح باستعمال خط الأعداد']);
  assert.deepEqual(skill.activityTypes,['count-on-addition','number-line-addition','count-back-subtraction','number-sentence','number-line-subtraction']);
});

test('chapter nine maps place value through ordering to one hundred',()=>{
  const skill=getKhaledSkill('place-value');
  assert.equal(skill.chapter,9);
  assert.deepEqual(skill.lessons,['الآحاد والعشرات','أحل المسألة: أخمن ثم أتحقق','الأعداد حتى 50','الأعداد حتى 100','التقدير','مقارنة الأعداد حتى 100','ترتيب الأعداد حتى 100']);
  assert.deepEqual(skill.activityTypes,['place-value-model','place-value-clue','number-to-50','number-to-100','estimate-nearest-ten','compare-to-100','order-to-100']);
});

test('chapter ten maps length, nonstandard units, mass and capacity',()=>{
  const skill=getKhaledSkill('measurement');
  assert.equal(skill.chapter,10);
  assert.deepEqual(skill.lessons,['مقارنة الأطوال وترتيبها','وحدات الطول غير القياسية','أحل المسألة: أخمن ثم أتحقق','مقارنة الكتل وترتيبها','مقارنة السعات وترتيبها']);
  assert.deepEqual(skill.activityTypes,['length-compare','nonstandard-length','measurement-guess-check','mass-compare','capacity-compare']);
});

test('chapter eleven maps tens, hundred chart and skip counting',()=>{
  const skill=getKhaledSkill('number-patterns');
  assert.equal(skill.chapter,11);
  assert.deepEqual(skill.lessons,['العد بالعشرات','أحل المسألة: أبحث عن نمط','لوحة المئة','العد القفزي: اثنينات، خمسات، عشرات']);
  assert.deepEqual(skill.activityTypes,['count-by-tens','find-number-pattern','hundred-chart','skip-count']);
});

test('chapter twelve maps solids, plane shapes and early fractions',()=>{
  const skill=getKhaledSkill('geometry-fractions');
  assert.equal(skill.chapter,12);
  assert.deepEqual(skill.lessons,['المجسمات','تصنيف المجسمات: يتدحرج، يتراص، ينزلق','أحل المسألة: أبحث عن النمط','الأشكال المستوية والمجسمات','الأشكال المستوية','الأجزاء المتطابقة','النصف','الثلث والربع']);
  assert.deepEqual(skill.activityTypes,['solid-identify','solid-classify','geometry-pattern','plane-solid-classify','plane-shape-identify','equal-parts','fraction-select']);
});

test('chapter thirteen maps recognition, counting, modeling, equal amounts and spending',()=>{
  const skill=getKhaledSkill('money');
  assert.equal(skill.chapter,13);
  assert.deepEqual(skill.lessons,['النقود: ريال واحد، ريالان، 5 ريالات، 10 ريالات','عد النقود','أحل المسألة: أمثلها','المبالغ المتساوية','استعمال النقود']);
  assert.deepEqual(skill.activityTypes,['money-recognition','count-money','money-model','equal-money-amounts','use-money']);
});

test('all thirteen Khaled curriculum groups are playable',()=>{
  const ready=getReadyKhaledSkills().map(skill=>skill.id);
  assert.deepEqual(ready,['classify-compare','numbers-0-5','position-pattern','numbers-6-10','numbers-11-20','addition-foundations','subtraction-foundations','add-sub-strategies','place-value','measurement','number-patterns','geometry-fractions','money']);
});
