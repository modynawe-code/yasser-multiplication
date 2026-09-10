const state=(assetKey,role,motionKey='')=>Object.freeze({assetKey,role,motionKey,artworkStatus:'pending'});

export const MASHAAL_CHARACTER_STATE_PACK=Object.freeze({
  defaultState:'ready',
  states:Object.freeze({
    ready:state('mashaal.character.ready','calm-ready'),
    thinking:state('mashaal.character.thinking','thinking','gentle-focus'),
    encouraging:state('mashaal.character.encouraging','encouraging','gentle-nod'),
    happy:state('mashaal.character.happy','happy','small-bounce'),
    celebrating:state('mashaal.character.celebrating','celebrating','celebrate'),
    'try-again':state('mashaal.character.try-again','retry','gentle-nod'),
    surprised:state('mashaal.character.surprised','surprised','small-pop'),
    proud:state('mashaal.character.proud','proud','gentle-rise'),
    'waiting-turn':state('mashaal.character.waiting-turn','waiting','calm-idle'),
    'receiving-reward':state('mashaal.character.receiving-reward','reward','celebrate')
  })
});
