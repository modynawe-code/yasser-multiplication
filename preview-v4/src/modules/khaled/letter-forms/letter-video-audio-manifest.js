// Voice-only lesson segments clipped from the user-provided Arabic-letter video.
// Times are source-video seconds; each interval isolates one letter's narration.
export const LETTER_VIDEO_AUDIO_ROOT='./assets/audio/khaled/letter-forms/video/';
export const LETTER_VIDEO_AUDIO_CLIPS=Object.freeze([
 Object.freeze({letter:'ا',id:'alif',start:6.16,end:17.46}),
 Object.freeze({letter:'ب',id:'ba',start:18.95,end:30.11}),
 Object.freeze({letter:'ت',id:'ta',start:32.20,end:42.45}),
 Object.freeze({letter:'ث',id:'tha',start:45.53,end:55.93}),
 Object.freeze({letter:'ج',id:'jim',start:57.82,end:67.60}),
 Object.freeze({letter:'ح',id:'ha',start:70.75,end:80.34}),
 Object.freeze({letter:'خ',id:'kha',start:83.54,end:93.02}),
 Object.freeze({letter:'د',id:'dal',start:96.32,end:105.63}),
 Object.freeze({letter:'ذ',id:'thal',start:108.74,end:118.08}),
 Object.freeze({letter:'ر',id:'ra',start:121.01,end:131.16}),
 Object.freeze({letter:'ز',id:'zay',start:134.40,end:144.06}),
 Object.freeze({letter:'س',id:'sin',start:147.78,end:158.07}),
 Object.freeze({letter:'ش',id:'shin',start:160.84,end:171.02}),
 Object.freeze({letter:'ص',id:'sad',start:173.66,end:183.70}),
 Object.freeze({letter:'ض',id:'dad',start:186.22,end:196.67}),
 Object.freeze({letter:'ط',id:'taa',start:198.91,end:208.62}),
 Object.freeze({letter:'ظ',id:'zaa',start:211.44,end:220.59}),
 Object.freeze({letter:'ع',id:'ain',start:224.24,end:234.01}),
 Object.freeze({letter:'غ',id:'ghain',start:237.37,end:247.75}),
 Object.freeze({letter:'ف',id:'fa',start:251.22,end:261.61}),
 Object.freeze({letter:'ق',id:'qaf',start:264.57,end:274.16}),
 Object.freeze({letter:'ك',id:'kaf',start:277.16,end:287.28}),
 Object.freeze({letter:'ل',id:'lam',start:289.99,end:300.09}),
 Object.freeze({letter:'م',id:'mim',start:302.50,end:312.46}),
 Object.freeze({letter:'ن',id:'nun',start:315.70,end:324.42}),
 Object.freeze({letter:'ه',id:'haa',start:328.36,end:338.36}),
 Object.freeze({letter:'و',id:'waw',start:341.56,end:351.49}),
 Object.freeze({letter:'ي',id:'ya',start:355.04,end:364.91})
]);
export const LETTER_VIDEO_AUDIO_BY_ID=Object.freeze(Object.fromEntries(LETTER_VIDEO_AUDIO_CLIPS.map(clip=>[clip.id,clip])));
