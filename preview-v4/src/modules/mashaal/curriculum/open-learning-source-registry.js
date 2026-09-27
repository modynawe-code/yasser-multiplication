export const MASHAAL_OPEN_LEARNING_SOURCES=Object.freeze({
  'kenney-cc0':Object.freeze({
    title:'Kenney Game Assets',
    license:'CC0 1.0',
    sourceUrl:'https://kenney.nl/',
    licenseUrl:'https://kenney.nl/support',
    use:['images','game-assets'],
    attributionRequired:false,
    note:'Official Kenney asset pages state game assets are public-domain CC0.'
  }),
  'storyweaver-ccby':Object.freeze({
    title:'Pratham Books StoryWeaver',
    license:'CC BY 4.0',
    sourceUrl:'https://storyweaver.org.in/en/open-content',
    licenseUrl:'https://creativecommons.org/licenses/by/4.0/',
    use:['stories','illustrations','adaptations'],
    attributionRequired:true,
    note:'Stories and illustrations are CC BY 4.0; readalongs/videos use a different license and are not included here.'
  }),
  'bookdash-ccby':Object.freeze({
    title:'Book Dash',
    license:'CC BY 4.0',
    sourceUrl:'https://bookdash.org/re-using-the-book-dash-content/',
    licenseUrl:'https://creativecommons.org/licenses/by/4.0/',
    use:['stories','illustrations','editable-source-files'],
    attributionRequired:true,
    note:'Books may be republished, translated and adapted with creator/Book Dash attribution.'
  }),
  'african-storybook-ccby':Object.freeze({
    title:'African Storybook',
    license:'CC BY 4.0',
    sourceUrl:'https://www.africanstorybook.org/',
    licenseUrl:'https://creativecommons.org/licenses/by/4.0/',
    use:['stories','illustrations','translations','adaptations'],
    attributionRequired:true,
    note:'Use only story pages explicitly marked CC BY 4.0.'
  }),
  'illustrative-math-k':Object.freeze({
    title:'Illustrative Mathematics Kindergarten Tasks',
    license:'CC BY-NC-SA 4.0',
    sourceUrl:'https://tasks.illustrativemathematics.org/K',
    licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    use:['math-task-ideas','adaptations'],
    attributionRequired:true,
    note:'Legacy task site marks tasks CC BY-NC-SA 4.0. We adapt concepts for this non-commercial family app.'
  }),
  'global-digital-library':Object.freeze({
    title:'Global Digital Library',
    license:'per-item Creative Commons',
    sourceUrl:'https://digitallibrary.io/about/license/',
    licenseUrl:'https://creativecommons.org/',
    use:['discovery','reading','open-education'],
    attributionRequired:true,
    note:'License must be checked per item before importing; primary licenses are CC BY and CC BY-SA.'
  })
});

export function getMashaalOpenLearningSource(id){return MASHAAL_OPEN_LEARNING_SOURCES[String(id||'')]||null;}
