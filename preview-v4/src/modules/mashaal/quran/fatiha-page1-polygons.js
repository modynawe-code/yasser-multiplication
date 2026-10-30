// Exact ayahPolygon paths from the bundled King Fahd Complex Hafs page-1 SVG.
// These shapes are display metadata only: Qur'an artwork is NEVER modified.
// Regression test checks every path against the original bundled SVG.
export const FATIHA_PAGE1_POLYGONS=Object.freeze({
  sourceId:'kfgqpc-hafs-madinah-svg',
  imagePath:'./assets/recitation/kfqc-hafs-page-1.svg',
  pageNumber:1,
  surahNumber:1,
  viewBox:"-53.3109 -198.4777 345 550",
  paths:Object.freeze([
    Object.freeze({ayahKey:'1:1',d:"M 181.08 18.31 L 57.54 18.31 L 57.54 48.94 L 181.08 48.94 Z"}),
    Object.freeze({ayahKey:'1:2',d:"M 203.87 49.07 L 36.74 49.07 L 36.74 76.22 L 203.87 76.22 Z"}),
    Object.freeze({ayahKey:'1:3',d:"M 229.77 76.22 L 128.52 76.22 L 128.52 103.24 L 229.77 103.24 Z"}),
    Object.freeze({ayahKey:'1:4',d:"M 128.52 76.22 L 12.95 76.22 L 12.59 103.24 L 128.52 103.24 Z"}),
    Object.freeze({ayahKey:'1:5',d:"M 229.77 103.24 L 56.04 103.24 L 56.04 130.26 L 229.52 131.26 Z"}),
    Object.freeze({ayahKey:'1:6',d:"M 56.04 103.24 L 8.09 103.24 L 8.09 129.77 L 229.52 131.26 L 229.52 160.65 L 114.20 160.65 L 114.20 130.39 L 55.79 130.02 Z"}),
    Object.freeze({ayahKey:'1:7',d:"M 113.70 130.39 L 13.82 130.39 L 13.82 162.77 L 37.11 162.77 L 37.11 189.05 L 73.48 189.05 L 73.48 214.95 L 171.86 214.95 L 171.86 191.54 L 204.99 191.54 L 204.99 160.65 L 113.70 160.28 L 113.70 130.39 Z"})
  ])
});
export function matchFatihaPage1Polygons(page,surahNumber,ayahTimings){
  if(surahNumber!==1||page?.pageNumber!==FATIHA_PAGE1_POLYGONS.pageNumber
    ||page?.sourceId!==FATIHA_PAGE1_POLYGONS.sourceId
    ||page?.imagePath!==FATIHA_PAGE1_POLYGONS.imagePath
    ||page?.offlineBundled!==true
    ||page?.focusRegion
    ||ayahTimings?.length!==7
    ||ayahTimings.some((ayah,index)=>ayah.ayahKey!==FATIHA_PAGE1_POLYGONS.paths[index].ayahKey)){
    return null;
  }
  return FATIHA_PAGE1_POLYGONS;
}
