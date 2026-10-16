export const MASHAAL_ENCOURAGEMENT_PACK=Object.freeze({
  cues:Object.freeze({
    turn:Object.freeze([
      Object.freeze({text:'دورك يا مشاعل',voiceKey:'mashaal.game.turn',characterState:'ready'})
    ]),
    retry:Object.freeze([
      Object.freeze({text:'جرّبي مرة ثانية',voiceKey:'mashaal.game.retry.1',characterState:'try-again'}),
      Object.freeze({text:'محاولة جميلة، كمّلي',voiceKey:'mashaal.game.retry.2',characterState:'encouraging'})
    ]),
    success:Object.freeze([
      Object.freeze({text:'أحسنتِ يا مشاعل',voiceKey:'mashaal.game.success.1',characterState:'happy'}),
      Object.freeze({text:'رائع، عرفتيها',voiceKey:'mashaal.game.success.2',characterState:'proud'})
    ]),
    completion:Object.freeze([
      Object.freeze({text:'كمّلتي اللعبة، ممتاز',voiceKey:'mashaal.game.completion',characterState:'celebrating'})
    ]),
    waiting:Object.freeze([
      Object.freeze({text:'الحين ننتظر الدور',voiceKey:'mashaal.game.waiting',characterState:'waiting-turn'})
    ]),
    win:Object.freeze([
      Object.freeze({text:'فزتي بالجولة، أحسنتِ',voiceKey:'mashaal.game.win',characterState:'celebrating'})
    ]),
    lose:Object.freeze([
      Object.freeze({text:'لعب جميل، نجرب مرة ثانية',voiceKey:'mashaal.game.lose',characterState:'encouraging'})
    ]),
    reward:Object.freeze([
      Object.freeze({text:'فتحتي كنزًا جديدًا',voiceKey:'mashaal.game.reward',characterState:'receiving-reward'})
    ])
  })
});
