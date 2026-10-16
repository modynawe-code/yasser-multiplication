import { getMashaalKg3Activity } from '../curriculum/kg3-activity-catalog.js';

const DEFINITIONS=Object.freeze([
  Object.freeze({activityId:'kg3-letter-hunt-ba-01',title:'مدينة الحروف',subtitle:'صيد الأصوات والحروف',previewKey:'duck'}),
  Object.freeze({activityId:'kg3-kitchen-count-01',title:'مطبخ مشاعل',subtitle:'عدّي وحضّري الطبق',previewKey:'apple'}),
  Object.freeze({activityId:'kg3-open-animal-count-01',title:'عدّي الحيوانات',subtitle:'عدّي واختاري الرقم',previewKey:'dog'}),
  Object.freeze({activityId:'kg3-memory-match-01',title:'لعبة الذاكرة',subtitle:'طابقي الصور المتشابهة',previewKey:'moon'}),
  Object.freeze({activityId:'kg3-open-animal-memory-01',title:'ذاكرة الحيوانات',subtitle:'بطة وكلب وببغاء',previewKey:'parrot'}),
  Object.freeze({activityId:'kg3-open-nature-memory-01',title:'ذاكرة الطبيعة',subtitle:'صور أصلية من ألوان الطبيعة',previewKey:'pratham-color-blue'}),
  Object.freeze({activityId:'kg3-open-zoo-memory-01',title:'ذاكرة الحديقة',subtitle:'صور أصلية من حديقة الحيوان',previewKey:'pratham-zoo-monkeys'}),
  Object.freeze({activityId:'kg3-open-animal-sort-01',title:'مزرعة أو برية؟',subtitle:'صنفي الحيوانات',previewKey:'cow'}),
  Object.freeze({activityId:'kg3-plant-growth-sequence-01',title:'حديقة مشاعل',subtitle:'رتبي نمو النبتة',previewKey:'plant'}),
  Object.freeze({activityId:'kg3-open-tree-cycle-01',title:'رحلة الشجرة',subtitle:'أوراق ثم أزهار ثم ثمار',previewKey:'pratham-tree-flowers'}),
  Object.freeze({activityId:'kg3-animal-habitat-01',title:'حديقة الحيوانات',subtitle:'وصّلي الحيوان لمكانه',previewKey:'duck'}),
  Object.freeze({activityId:'kg3-animal-maze-duck-01',title:'متاهة الحيوانات',subtitle:'وصّلي البطة للبركة',previewKey:'pond'}),
  Object.freeze({activityId:'kg3-color-mix-orange-01',title:'مختبر مشاعل',subtitle:'اخلطي الألوان واكتشفي',previewKey:'orange'}),
  Object.freeze({activityId:'kg3-open-colors-nature-01',title:'ألوان الطبيعة',subtitle:'اختاري اللون من الرسمة الأصلية',previewKey:'pratham-color-orange'}),
  Object.freeze({activityId:'kg3-open-zoo-find-01',title:'اكتشفي حديقة الحيوان',subtitle:'دوري على الصورة الصحيحة',previewKey:'pratham-zoo-family'}),
  Object.freeze({activityId:'kg3-interactive-story-morning-01',title:'قصة مشاعل',subtitle:'اختاري وكَمّلي القصة',previewKey:'wake'}),
  Object.freeze({activityId:'kg3-open-seed-journey-01',title:'مغامرة جمع البذور',subtitle:'رتبي مشاهد الرحلة',previewKey:'pratham-seed-walk'}),
  Object.freeze({activityId:'kg3-open-tinku-night-01',title:'قصة تينكو الليلية',subtitle:'رتبي لقاءات تينكو',previewKey:'pratham-tinku-firefly'}),
  Object.freeze({activityId:'kg3-picture-puzzle-01',title:'بزل الصور',subtitle:'ركّبي الصورة من القطع',imagePath:'assets/mashaal/domains/thinking.webp'}),
  Object.freeze({activityId:'kg3-open-animal-puzzle-01',title:'بزل الحيوان',subtitle:'ركّبي صورة الكلب',imagePath:'assets/oer/kenney/animals/dog.png'}),
  Object.freeze({activityId:'kg3-open-nature-puzzle-01',title:'بزل ألوان الطبيعة',subtitle:'ركّبي الرسمة الأصلية',imagePath:'assets/oer/pratham/0071/06.jpg'}),
  Object.freeze({activityId:'kg3-open-moru-puzzle-01',title:'بزل الأرقام مع مورو',subtitle:'ركّبي الرسمة الأصلية',imagePath:'assets/oer/pratham/0006/24.jpg'}),
  Object.freeze({activityId:'kg3-open-zoo-puzzle-01',title:'بزل حديقة الحيوان',subtitle:'ركّبي الرسمة الأصلية',imagePath:'assets/oer/pratham/0120/03.jpg'}),
  Object.freeze({activityId:'kg3-open-tree-puzzle-bank-01',title:'بزل رحلة الشجرة',subtitle:'13 رسمة أصلية للاختيار',imagePath:'assets/oer/pratham/0433/08.jpg'}),
  Object.freeze({activityId:'kg3-open-seed-puzzle-bank-01',title:'بزل مغامرة البذور',subtitle:'19 رسمة أصلية للاختيار',imagePath:'assets/oer/pratham/0352/12.jpg'}),
  Object.freeze({activityId:'kg3-open-tinku-puzzle-bank-01',title:'بزل تينكو',subtitle:'12 رسمة أصلية للاختيار',imagePath:'assets/oer/pratham/0056/08.jpg'}),
]);

export function listMashaalPlayExperiences(){
  return DEFINITIONS.map(definition=>{
    const activity=getMashaalKg3Activity(definition.activityId);
    return Object.freeze({
      ...definition,
      skillId:activity?.skillId||'',
      activityType:activity?.activityType||'',
      available:Boolean(activity)
    });
  });
}

export function getMashaalPlayExperience(activityId){
  return listMashaalPlayExperiences().find(item=>item.activityId===String(activityId||''))||null;
}
