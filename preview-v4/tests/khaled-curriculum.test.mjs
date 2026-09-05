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
  assert.deepEqual(skill.lessons,[
    'التصنيف وفق خاصية واحدة',
    'التصنيف وفق أكثر من خاصية',
    'يساوي',
    'أكثر من وأقل من'
  ]);
  assert.deepEqual(skill.activityTypes,[
    'classify-one-property',
    'classify-two-properties',
    'equality-groups',
    'compare-groups'
  ]);
});

test('position and pattern structure covers the five early lessons',()=>{
  const skill=getKhaledSkill('position-pattern');
  assert.equal(skill.lessons.length,5);
  for(const lesson of ['فوق وتحت','أعلى وأوسط وأسفل','قبل وبعد','تحديد الأنماط','إنشاء الأنماط'])assert.ok(skill.lessons.includes(lesson));
});

test('six first-term Khaled skill groups are playable while subtraction stays locked',()=>{
  const ready=getReadyKhaledSkills().map(skill=>skill.id);
  assert.deepEqual(ready,[
    'classify-compare',
    'numbers-0-5',
    'position-pattern',
    'numbers-6-10',
    'numbers-11-20',
    'addition-foundations'
  ]);
  assert.equal(getKhaledSkill('numbers-11-20').status,'ready');
  assert.equal(getKhaledSkill('addition-foundations').status,'ready');
  assert.equal(getKhaledSkill('subtraction-foundations').status,'later');
});
