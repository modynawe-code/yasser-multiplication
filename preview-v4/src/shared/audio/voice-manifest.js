export const VOICE_MANIFEST=Object.freeze({
  'games.rps.turn.yasser':'assets/audio/rps/turn-yasser.mp3',
  'games.rps.turn.khaled':'assets/audio/rps/turn-khaled.mp3',
  'games.rps.draw':'assets/audio/rps/draw.mp3',
  'games.rps.point.yasser':'assets/audio/rps/point-yasser.mp3',
  'games.rps.point.khaled':'assets/audio/rps/point-khaled.mp3',
  'games.rps.win.yasser':'assets/audio/rps/win-yasser.mp3',
  'games.rps.win.khaled':'assets/audio/rps/win-khaled.mp3'
});

export function resolveVoiceAsset(id,manifest=VOICE_MANIFEST){
  if(!id)return null;
  const src=manifest?.[id];
  return typeof src==='string'&&src.trim()?src:null;
}
