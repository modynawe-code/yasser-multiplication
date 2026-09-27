import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalKg3Activity } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
import { createMashaalActivityViewModel } from '../src/modules/mashaal/ui/activity-view-model.js';
import { getActivityRendererContract } from '../src/shared/activities/activity-renderer-contracts.js';
import { addMashaalSequenceValue,buildMashaalMemoryDeck,mashaalTraceIsComplete,isMashaalLetterHuntTarget,canAddMashaalKitchenItem,isMashaalHabitatMatch,isMashaalColorMixCorrect,moveMashaalMaze,createMashaalPuzzleOrder,swapMashaalPuzzleTiles,isMashaalPuzzleSolved } from '../src/modules/mashaal/ui/mashaal-interaction-engines.js';

test('memory deck creates exactly two cards per visual without losing pair identity',()=>{
  const deck=buildMashaalMemoryDeck(['apple','moon','ball'],{random:()=>0});
  assert.equal(deck.length,6);
  for(const pair of ['apple','moon','ball'])assert.equal(deck.filter(card=>card.pair===pair).length,2);
  assert.equal(new Set(deck.map(card=>card.id)).size,6);
});

test('drag sequence helper keeps one copy of each selected item',()=>{
  let order=[];
  order=addMashaalSequenceValue(order,'wake');
  order=addMashaalSequenceValue(order,'brush-teeth');
  order=addMashaalSequenceValue(order,'wake');
  assert.deepEqual(order,['wake','brush-teeth']);
});

test('trace completion requires reaching the end and enough checkpoints',()=>{
  assert.equal(mashaalTraceIsComplete(14,14),true);
  assert.equal(mashaalTraceIsComplete(10,14),false);
  assert.equal(mashaalTraceIsComplete(3,14),false);
});

test('Mashaal memory activity is releasable through the generic view model and renderer contract',()=>{
  const activity=getMashaalKg3Activity('kg3-memory-match-01');
  const model=createMashaalActivityViewModel(activity);
  assert.equal(model.activityType,'memory-match');
  assert.equal(model.completionOnly,true);
  assert.deepEqual(model.stimulus.items,['apple','moon','ball']);
  assert.deepEqual(getActivityRendererContract('memory-match'),{renderer:'memory-match',mode:'memory',hideStimulus:true});
});

test('ordered sequence and tracing are routed to interactive renderers',()=>{
  assert.equal(getActivityRendererContract('ordered-sequence').renderer,'drag-sequence');
  assert.equal(getActivityRendererContract('guided-tracing').renderer,'tracing-pad');
  assert.equal(getActivityRendererContract('guided-tracing').hideStimulus,true);
});


test('letter hunt recognizes only configured sound targets',()=>{
  assert.equal(isMashaalLetterHuntTarget('duck',['duck','door']),true);
  assert.equal(isMashaalLetterHuntTarget('door',['duck','door']),true);
  assert.equal(isMashaalLetterHuntTarget('apple',['duck','door']),false);
});

test('kitchen counter stops exactly at the requested quantity',()=>{
  assert.equal(canAddMashaalKitchenItem(0,3),true);
  assert.equal(canAddMashaalKitchenItem(2,3),true);
  assert.equal(canAddMashaalKitchenItem(3,3),false);
  assert.equal(canAddMashaalKitchenItem(4,3),false);
});

test('named play experiences keep curriculum binding and dedicated renderers',()=>{
  const hunt=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-letter-hunt-ba-01'));
  const kitchen=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-kitchen-count-01'));
  const garden=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-plant-growth-sequence-01'));
  assert.equal(hunt.experienceTitleAr,'مدينة الحروف');
  assert.equal(hunt.activityType,'letter-hunt');
  assert.deepEqual(hunt.stimulus.targets,['duck','door']);
  assert.equal(kitchen.experienceTitleAr,'مطبخ مشاعل');
  assert.equal(kitchen.stimulus.count,3);
  assert.equal(garden.experienceTitleAr,'حديقة مشاعل');
  assert.deepEqual(garden.correctValues,['seed','sprout','plant']);
  assert.equal(getActivityRendererContract('letter-hunt').renderer,'letter-hunt');
  assert.equal(getActivityRendererContract('kitchen-count').renderer,'kitchen-count');
});


test('animal habitat matching accepts only the configured home',()=>{
  const pairs={duck:'pond',parrot:'nest',dog:'home'};
  assert.equal(isMashaalHabitatMatch('duck','pond',pairs),true);
  assert.equal(isMashaalHabitatMatch('duck','nest',pairs),false);
  assert.equal(isMashaalHabitatMatch('dog','home',pairs),true);
});

test('color lab treats the correct pair as order-independent',()=>{
  assert.equal(isMashaalColorMixCorrect(['red','yellow'],['red','yellow']),true);
  assert.equal(isMashaalColorMixCorrect(['yellow','red'],['red','yellow']),true);
  assert.equal(isMashaalColorMixCorrect(['blue','yellow'],['red','yellow']),false);
});

test('animal and color lab activities keep named child-facing experiences',()=>{
  const animals=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-animal-habitat-01'));
  const colors=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-color-mix-orange-01'));
  assert.equal(animals.experienceTitleAr,'حديقة الحيوانات');
  assert.deepEqual(animals.stimulus.pairs,{duck:'pond',parrot:'nest',dog:'home'});
  assert.equal(colors.experienceTitleAr,'مختبر مشاعل');
  assert.deepEqual(colors.stimulus.correctPair,['red','yellow']);
  assert.equal(getActivityRendererContract('animal-habitat').renderer,'animal-habitat');
  assert.equal(getActivityRendererContract('color-mix-lab').renderer,'color-mix-lab');
});


test('interactive story is curriculum-bound and uses a dedicated renderer',()=>{
  const story=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-interactive-story-morning-01'));
  assert.equal(story.experienceTitleAr,'قصة مشاعل');
  assert.equal(story.activityType,'interactive-story');
  assert.equal(story.stimulus.steps.length,2);
  assert.deepEqual(story.stimulus.steps[0].choices,['brush-teeth','ball']);
  assert.equal(story.stimulus.steps[0].correctChoice,'brush-teeth');
  assert.equal(getActivityRendererContract('interactive-story').renderer,'interactive-story');
});


test('animal maze movement respects walls and board edges',()=>{
  assert.deepEqual(moveMashaalMaze([0,0],'left',{size:5,walls:[]}),[0,0]);
  assert.deepEqual(moveMashaalMaze([0,0],'right',{size:5,walls:['0,1']}),[0,0]);
  assert.deepEqual(moveMashaalMaze([0,0],'down',{size:5,walls:['0,1']}),[1,0]);
  assert.deepEqual(moveMashaalMaze([4,4],'down',{size:5,walls:[]}),[4,4]);
});

test('animal maze stays curriculum-bound and daily-play compatible',()=>{
  const maze=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-animal-maze-duck-01'));
  assert.equal(maze.experienceTitleAr,'متاهة الحيوانات');
  assert.equal(maze.activityType,'animal-maze');
  assert.equal(maze.stimulus.size,5);
  assert.deepEqual(maze.stimulus.start,[0,0]);
  assert.deepEqual(maze.stimulus.finish,[4,4]);
  assert.equal(getActivityRendererContract('animal-maze').renderer,'animal-maze');
});


test('picture puzzle starts shuffled and solves through explicit swaps',()=>{
  const start=createMashaalPuzzleOrder(4);
  assert.deepEqual(start,[2,0,3,1]);
  assert.equal(isMashaalPuzzleSolved(start),false);
  let order=swapMashaalPuzzleTiles(start,0,1);
  order=swapMashaalPuzzleTiles(order,1,3);
  order=swapMashaalPuzzleTiles(order,2,3);
  assert.deepEqual(order,[0,1,2,3]);
  assert.equal(isMashaalPuzzleSolved(order),true);
});

test('picture puzzle stays curriculum-bound and uses local Mashaal art',()=>{
  const puzzle=createMashaalActivityViewModel(getMashaalKg3Activity('kg3-picture-puzzle-01'));
  assert.equal(puzzle.experienceTitleAr,'بزل الصور');
  assert.equal(puzzle.activityType,'picture-puzzle');
  assert.equal(puzzle.stimulus.rows,2);
  assert.equal(puzzle.stimulus.cols,2);
  assert.match(puzzle.stimulus.imagePath,/^assets\/mashaal\/domains\/thinking\.webp$/);
  assert.equal(getActivityRendererContract('picture-puzzle').renderer,'picture-puzzle');
});
