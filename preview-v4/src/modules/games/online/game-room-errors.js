export function isRoomUnavailableError(error){
  return error?.status===404&&error?.body?.error==='room_not_found'||error?.status===401&&error?.body?.error==='invalid_game_token';
}
export function onlineErrorMessage(error){
  const code=error?.body?.error||error?.message;
  const messages={
    room_not_found:'انتهت صلاحية الغرفة أو لم تعد موجودة. أنشئوا غرفة جديدة.',
    invalid_game_token:'تعذّر التحقق من هوية اللاعب في هذه الغرفة.',
    learner_already_in_room:'اللاعب موجود في الغرفة. استخدم زر متابعة الغرفة من جهازه السابق.',
    room_not_waiting:'الجولة بدأت. ارجع لها من زر متابعة الغرفة.',
    room_full:'الغرفة مكتملة اللاعبين.',
    too_many_join_attempts:'محاولات دخول كثيرة. انتظر قليلًا ثم حاول.',
    too_many_rooms:'تم إنشاء غرف كثيرة. انتظر قليلًا ثم حاول.',
    version_conflict:'تغيّرت حالة الجولة. حدّثناها؛ حاول الحركة مجددًا.'
  };
  return messages[code]||'تعذّر الاتصال بالغرفة. بيانات الاستعادة محفوظة؛ حاول مجددًا.';
}
