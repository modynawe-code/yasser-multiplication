// Development pilot only: acoustic pause estimates for the EXACT existing
// KFGQPC Ibrahim Al-Akhdar Hafs MP3. NOT human-reviewed Quran ayah boundaries.
// Never use this module to grade memorization or publish approved timings.
export const FATIHA_REVIEW_CANDIDATE=Object.freeze({
  status:'ACOUSTIC_ONLY_UNVERIFIED',
  sourceId:'kfgqpc-ibrahim-al-akhdar-hafs',
  surahNumber:1,
  audioSha256:'16d025c0ffbe8db50842b1963c74e37e8620da18fff4fa7588b0187ed15af4f4',
  durationSeconds:64.9568,
  // Six pauses stable at -38/-33/-28 dB; first/last include lead-in/tail.
  ayahTimings:Object.freeze([
    [0,13145],[13145,19953],[19953,25548],[25548,31477],
    [31477,39204],[39204,45804],[45804,64957]
  ].map(([startMs,endMs],index)=>Object.freeze({
    ayahKey:'1:'+String(index+1),startMs,endMs
  })))
});

export function verifiedFatihaReviewPilot(asset,candidate=FATIHA_REVIEW_CANDIDATE){
  if(!asset||asset.surahNumber!==1||asset.sourceId!==candidate.sourceId
    ||asset.sha256!==candidate.audioSha256
    ||asset.localPath!=='./assets/recitation/ibrahim-al-akhdar-hafs-1-al-fatiha.mp3'
    ||asset.mushafPage?.pageNumber!==1
    ||candidate.status!=='ACOUSTIC_ONLY_UNVERIFIED'
    ||!Number.isFinite(candidate.durationSeconds)||candidate.durationSeconds<=0
    ||candidate.ayahTimings?.length!==7)return null;
  let end=0;
  for(let i=0;i<7;i++){
    const t=candidate.ayahTimings[i];
    if(t.ayahKey!=='1:'+String(i+1)||t.startMs!==end||!Number.isInteger(t.endMs)
      ||t.endMs<=t.startMs||t.endMs>candidate.durationSeconds*1000+200)return null;
    end=t.endMs;
  }
  return Object.freeze({
    audioPath:asset.localPath,
    mushafPage:asset.mushafPage,
    ayahTimings:candidate.ayahTimings,
    durationSeconds:candidate.durationSeconds
  });
}
