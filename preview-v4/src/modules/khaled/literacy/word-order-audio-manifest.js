// Short, voice-only cuts from the lesson video "word-reading-practice.mp4".
// Times point to the teacher's word readings; the corresponding pointer stays
// on the same printed word in the source video. No video is played in the game.
export const WORD_ORDER_AUDIO_ROOT='./assets/audio/khaled/literacy/word-order/';
export const WORD_ORDER_AUDIO_CLIPS=Object.freeze([
  {word:'رَمْل',id:'raml',start:4.02,end:4.92},
  {word:'بَرَد',id:'barad',start:6.43,end:7.30},
  {word:'بَدْر',id:'badr',start:8.68,end:9.55},
  {word:'بَدَن',id:'badan',start:11.48,end:12.35},
  {word:'لَبَن',id:'laban',start:12.45,end:13.40},
  {word:'بَلَد',id:'balad',start:15.95,end:17.10},
  {word:'نَار',id:'naar',start:19.95,end:21.45},
  {word:'نُور',id:'noor',start:21.48,end:22.38},
  {word:'دَار',id:'daar',start:26.45,end:27.35},
  {word:'دِين',id:'deen',start:28.78,end:30.20},
  {word:'مَال',id:'maal',start:31.85,end:32.75},
  {word:'نِيل',id:'neel',start:35.75,end:36.98}
].map(Object.freeze));
export const WORD_ORDER_AUDIO_BY_WORD=Object.freeze(Object.fromEntries(WORD_ORDER_AUDIO_CLIPS.map(clip=>[clip.word,clip])));
