export const MASHAAL_PRATHAM_OPEN_PACKS=Object.freeze({
  '0433':Object.freeze({
    title:'The Tree',author:'Usha Rane',illustrator:'Ketan Raut',license:'CC BY 4.0',
    storyUrl:'https://storyweaver.org.in/stories/212-the-tree',
    basePath:'assets/oer/pratham/0433',imageCount:13
  }),
  '0352':Object.freeze({
    title:"Let's Go Seed Collecting!",author:'Neha Sumitran',illustrator:'Archana Sreenivasan',license:'CC BY 4.0',
    storyUrl:'https://storyweaver.org.in/stories/4407-let-s-go-seed-collecting',
    basePath:'assets/oer/pratham/0352',imageCount:19
  }),
  '0071':Object.freeze({
    title:'Colours of Nature',author:'Bulbul Sharma',illustrator:'Bulbul Sharma',license:'CC BY 4.0',
    storyUrl:'https://storyweaver.org.in/stories/409-colours-of-nature',
    basePath:'assets/oer/pratham/0071',imageCount:17
  })
});

export function getMashaalPrathamOpenPack(id){return MASHAAL_PRATHAM_OPEN_PACKS[String(id||'')]||null;}
