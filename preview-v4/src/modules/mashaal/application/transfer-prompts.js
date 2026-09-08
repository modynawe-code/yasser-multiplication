export const MASHAAL_TRANSFER_PROMPTS = Object.freeze({
  'listen-follow-simple-directions':Object.freeze(['خلي أحد الكبار يقول لك خطوتين بسيطتين، ونفذيها بالترتيب.']),
  'oral-vocabulary-expression':Object.freeze(['اختاري لعبة من حولك وقولي جملة كاملة عنها.']),
  'story-sequencing':Object.freeze(['احكي ثلاثة أشياء سويتيها اليوم بالترتيب.']),
  'sound-awareness':Object.freeze(['دوري حولك على شيء يبدأ اسمه بصوت ب.']),
  'letter-sound-readiness':Object.freeze(['اختاري شيئًا يبدأ اسمه بصوت ب وقولي الصوت ثم اسم الشيء.']),
  'prewriting-fine-motor':Object.freeze(['ارسمي على ورقة طريقًا متعرجًا من دائرة إلى نجمة.']),
  'count-and-quantity':Object.freeze(['عدّي أربع ألعاب من حولك.']),
  'compare-quantities':Object.freeze(['اعملي مجموعتين من الألعاب وقولي أي مجموعة فيها أكثر.']),
  'classify-sort':Object.freeze(['اجمعي ثلاثة أشياء ورتبيها حسب اللون.']),
  patterns:Object.freeze(['رتبي أربع قطع بنمط يتكرر: لون، لون آخر، ثم أعيدي النمط.']),
  'shapes-space':Object.freeze(['دوري حولك على شيء دائري.']),
  'observe-reason':Object.freeze(['اختاري شيئًا في الغرفة وقولي: ماذا تتوقعين يصير لو حركناه أو غيرنا مكانه؟']),
  'healthy-habits':Object.freeze(['وريني خطوات غسل اليدين.'])
});

export function getMashaalTransferPrompt(skillId){
  return MASHAAL_TRANSFER_PROMPTS[skillId]?.[0]||'';
}
