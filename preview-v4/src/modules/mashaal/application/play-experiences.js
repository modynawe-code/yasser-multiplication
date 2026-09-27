import { getMashaalKg3Activity } from '../curriculum/kg3-activity-catalog.js';

const DEFINITIONS=Object.freeze([
  Object.freeze({activityId:'kg3-letter-hunt-ba-01',title:'مدينة الحروف',subtitle:'صيد الأصوات والحروف',previewKey:'duck'}),
  Object.freeze({activityId:'kg3-kitchen-count-01',title:'مطبخ مشاعل',subtitle:'عدّي وحضّري الطبق',previewKey:'apple'}),
  Object.freeze({activityId:'kg3-memory-match-01',title:'لعبة الذاكرة',subtitle:'طابقي الصور المتشابهة',previewKey:'moon'}),
  Object.freeze({activityId:'kg3-plant-growth-sequence-01',title:'حديقة مشاعل',subtitle:'رتبي نمو النبتة',previewKey:'plant'}),
  Object.freeze({activityId:'kg3-animal-habitat-01',title:'حديقة الحيوانات',subtitle:'وصّلي الحيوان لمكانه',previewKey:'duck'}),
  Object.freeze({activityId:'kg3-animal-maze-duck-01',title:'متاهة الحيوانات',subtitle:'وصّلي البطة للبركة',previewKey:'pond'}),
  Object.freeze({activityId:'kg3-color-mix-orange-01',title:'مختبر مشاعل',subtitle:'اخلطي الألوان واكتشفي',previewKey:'orange'}),
  Object.freeze({activityId:'kg3-interactive-story-morning-01',title:'قصة مشاعل',subtitle:'اختاري وكَمّلي القصة',previewKey:'wake'}),
  Object.freeze({activityId:'kg3-picture-puzzle-01',title:'بزل الصور',subtitle:'ركّبي الصورة من القطع',imagePath:'assets/mashaal/domains/thinking.webp'})
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
