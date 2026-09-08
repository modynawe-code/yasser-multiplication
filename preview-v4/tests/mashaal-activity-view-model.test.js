import test from 'node:test';
import assert from 'node:assert/strict';
import { MASHAAL_KG3_ACTIVITY_CATALOG } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { createMashaalActivityViewModel,isMashaalActivityAnswerCorrect } from '../src/modules/mashaal/ui/activity-view-model.js';

test('KG3 activity view model renders catalog data without skill-specific branching',()=>{
  for(const activity of MASHAAL_KG3_ACTIVITY_CATALOG){
    const model=createMashaalActivityViewModel(activity);
    assert.equal(model.id,activity.id);
    assert.equal(model.skillId,activity.skillId);
    assert.ok(model.promptAr.length>0);
    assert.ok(model.audioPromptAr.length>0);
    assert.ok(model.choices.length>0);
  }
});

test('single-choice and sorting answers use one correctness contract',()=>{
  const choice=createMashaalActivityViewModel(MASHAAL_KG3_ACTIVITY_CATALOG.find(item=>item.id==='kg3-pattern-01'));
  assert.equal(isMashaalActivityAnswerCorrect(choice,'circle'),true);
  assert.equal(isMashaalActivityAnswerCorrect(choice,'star'),false);

  const sorting=createMashaalActivityViewModel(MASHAAL_KG3_ACTIVITY_CATALOG.find(item=>item.id==='kg3-classify-sort-01'));
  assert.equal(isMashaalActivityAnswerCorrect(sorting,['red-square','red-circle']),true);
  assert.equal(isMashaalActivityAnswerCorrect(sorting,['red-circle']),false);
});

test('ordered listening activity requires the spoken touch sequence in the same order',()=>{
  const ordered=createMashaalActivityViewModel(MASHAAL_KG3_ACTIVITY_CATALOG.find(item=>item.id==='kg3-listen-two-step-choice-01'));
  assert.equal(ordered.orderedSequence,true);
  assert.equal(isMashaalActivityAnswerCorrect(ordered,['star','ball']),true);
  assert.equal(isMashaalActivityAnswerCorrect(ordered,['ball','star']),false);
});
