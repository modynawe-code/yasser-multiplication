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

test('seven core Khaled skill groups are playable through subtraction',()=>{
  const ready=getReadyKhaledSkills().map(skill=>skill.id);
  assert.deepEqual(ready,['classify-compare','numbers-0-5','position-pattern','numbers-6-10','numbers-11-20','addition-foundations','subtraction-foundations']);
});
