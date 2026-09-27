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
  }),
  '0056':Object.freeze({
    title:'Goodnight, Tinku!',author:'Preethi Nambiar',illustrator:'Sonal Goyal, Sumit Sakhuja',license:'CC BY 4.0',
    storyUrl:'https://storyweaver.org.in/stories/258-goodnight-tinku',
    basePath:'assets/oer/pratham/0056',imageCount:12
  }),
  '0006':Object.freeze({
    title:'Counting on Moru',author:'Rukmini Banerji',illustrator:'Nina Sabnani',license:'CC BY 4.0',
    storyUrl:'https://storyweaver.org.in/stories/38-counting-on-moru',
    basePath:'assets/oer/pratham/0006',imageCount:24
  })
});

export function getMashaalPrathamOpenPack(id){return MASHAAL_PRATHAM_OPEN_PACKS[String(id||'')]||null;}
