// Original monoline teaching paths. Coordinates share a 500×340 board, baseline 210.
// Separate path entries mean lift the pen. Dots are explicit, independent strokes.
const tail=' C260 285 125 290 130 210';
const bowl='M350 170 Q360 210 325 210 L175 210 Q135 210 145 165';
const tooth='M320 155 L320 195 Q320 210 295 210';
const incoming='M435 210 L355 210';
const outgoing=' L90 210';
const b={isolated:[bowl],initial:[tooth+outgoing],medial:[incoming+' Q320 210 320 178 Q320 210 285 210'+outgoing],final:[incoming+' Q330 210 330 175 L330 210 L180 210 Q135 210 145 170']};
const j={isolated:['M345 145 Q300 120 230 160 L320 185 Q170 180 170 240 Q170 305 295 280'],initial:['M345 145 Q300 120 230 160 L320 185 Q265 210 205 210'+outgoing],medial:[incoming+' L325 175 L245 150 L310 140 Q340 140 350 155','M325 175 Q270 210 205 210'+outgoing],final:[incoming+' L325 175 L245 150 L310 140 Q340 140 350 155','M325 175 Q180 190 175 240 Q175 305 295 280']};
const sFirst='M365 160 L365 190 Q365 210 345 210 Q325 210 325 183 Q325 210 305 210 Q285 210 285 183 Q285 210 260 210';
const s={isolated:[sFirst+tail],initial:[sFirst+outgoing],medial:[incoming+' Q380 210 365 180 Q365 210 345 210 Q325 210 325 183 Q325 210 305 210 Q285 210 285 183 Q285 210 260 210'+outgoing],final:[incoming+' Q380 210 365 180 Q365 210 345 210 Q325 210 325 183 Q325 210 305 210 Q285 210 285 183 Q285 210 260 210'+tail]};
const sadHead='M235 210 Q270 175 305 155 Q345 135 365 160 Q390 205 335 210 L235 210';
const sad={isolated:[sadHead+' Q220 275 165 275 Q115 275 130 210'],initial:[sadHead+outgoing],medial:[incoming+' L235 210 Q270 175 305 155 Q345 135 365 160 Q390 205 335 210 L235 210'+outgoing],final:[incoming+' L235 210 Q270 175 305 155 Q345 135 365 160 Q390 205 335 210 L235 210 Q220 275 165 275 Q115 275 130 210']};
const taHead='M205 210 Q240 175 290 155 Q345 140 350 180 Q355 210 295 210 L205 210';
const tta={isolated:[taHead,'M235 210 L235 85'],initial:[taHead+outgoing,'M235 210 L235 85'],medial:[incoming+' L205 210 Q240 175 290 155 Q345 140 350 180 Q355 210 295 210 L205 210'+outgoing,'M235 210 L235 85'],final:[incoming+' L205 210 Q240 175 290 155 Q345 140 350 180 Q355 210 295 210 L205 210','M235 210 L235 85']};
const ain={isolated:['M335 135 Q260 100 245 150 Q240 175 315 175 Q175 195 185 245 Q195 295 310 275'],initial:['M325 135 Q280 110 250 145 Q230 180 305 180 Q250 210 195 210'+outgoing],medial:[incoming+' L300 155 L235 180 L300 210 L90 210'],final:[incoming+' L300 155 L235 180 L300 210 Q180 220 190 260 Q200 295 310 280']};
const f={isolated:['M330 210 Q385 155 345 140 Q300 135 315 170 Q325 190 355 180 L355 205 Q355 225 180 225 Q140 225 145 190'],initial:['M325 210 Q370 160 330 145 Q300 135 300 165 Q300 190 345 180 Q350 210 290 210'+outgoing],medial:[incoming+' Q355 210 325 175 Q305 145 330 140 Q365 140 360 175 Q355 210 285 210'+outgoing],final:[incoming+' Q355 210 325 175 Q305 145 330 140 Q365 140 360 175 L360 205 Q360 225 180 225 Q140 225 145 190']};
const q={...f,isolated:['M330 185 Q375 135 335 130 Q305 125 310 155 Q315 180 350 170 L345 220 Q335 280 245 280 Q150 280 165 205'],final:[incoming+' Q355 210 325 175 Q305 145 330 140 Q365 140 360 175 L350 225 Q335 280 245 280 Q150 280 165 205']};
const kaf={isolated:['M345 95 L345 200 Q345 225 175 225 Q140 225 145 185','M280 140 L250 160 L275 175 L240 185'],initial:['M350 95 L260 155 L330 195 Q340 210 295 210'+outgoing],medial:[incoming+' Q355 210 330 190 L265 150 L350 95','M330 190 Q315 210 265 210'+outgoing],final:[incoming+' Q345 210 345 190 L345 95','M345 190 L345 205 Q345 225 175 225 Q140 225 145 185','M280 140 L250 160 L275 175 L240 185']};
const lam={isolated:['M315 90 L315 220 Q315 280 230 280 Q170 280 185 210'],initial:['M300 90 L300 190 Q300 210 260 210'+outgoing],medial:[incoming+' Q300 210 300 185 L300 90','M300 185 Q300 210 260 210'+outgoing],final:[incoming+' Q315 210 315 190 L315 90','M315 190 L315 220 Q315 280 230 280 Q170 280 185 210']};
const mim={isolated:['M345 180 Q345 140 305 150 Q275 170 310 190 Q340 200 345 180 Q285 185 245 210 L245 290'],initial:['M345 210 Q345 165 305 175 Q280 200 315 210 Q340 210 345 195 Q295 190 260 210'+outgoing],medial:[incoming+' Q355 210 330 185 Q300 160 290 190 Q285 215 320 210 Q345 210 330 190','M300 210 L90 210'],final:[incoming+' Q350 210 330 185 Q300 160 285 185 Q280 210 320 210 Q340 200 330 185','M285 195 L245 220 L245 290']};
const nun={...b,isolated:['M345 175 L345 215 Q345 275 255 275 Q170 275 180 180'],final:[incoming+' Q345 210 345 180 L345 220 Q345 275 255 275 Q170 275 180 180']};
const ha={isolated:['M320 155 Q365 205 310 225 Q245 240 250 190 Q255 145 285 150 Q305 150 320 155 Z'],initial:['M330 210 Q375 150 320 135 Q275 130 260 185 Q260 215 305 210 Q340 205 315 180 Q295 160 275 180 Q260 210 220 210'+outgoing],medial:[incoming+' Q340 210 285 150 Q250 140 260 180 Q275 215 315 210 Q340 210 300 250 Q265 275 255 240 Q255 210 220 210'+outgoing],final:[incoming+' L265 210 Q310 195 320 150 Q245 150 245 190 Q245 225 310 210']};
const ya={...b,isolated:['M335 145 Q285 130 285 165 Q285 180 320 190 Q350 210 310 235 Q265 275 205 265 Q155 255 165 205'],final:[incoming+' Q335 210 300 235 Q255 275 200 265 Q155 255 165 205']};
const single={
 'ا':{isolated:['M260 90 L260 210'],final:[incoming+' Q285 210 275 195 L265 90']},
 'د':{isolated:['M300 145 Q325 170 330 195 Q335 215 235 215'],final:[incoming+' Q350 210 325 175 L300 145','M325 175 Q350 215 235 215']},
 'ر':{isolated:['M310 165 Q340 235 225 275'],final:[incoming+' Q335 210 310 185 Q335 245 225 275']},
 'و':{isolated:['M325 200 Q375 150 325 145 Q285 145 295 180 Q300 205 345 190 Q340 250 230 275'],final:[incoming+' Q355 210 325 175 Q305 145 330 140 Q365 140 360 175 Q355 250 230 275']}
};
const families={'ب':b,'ت':b,'ث':b,'ج':j,'ح':j,'خ':j,'س':s,'ش':s,'ص':sad,'ض':sad,'ط':tta,'ظ':tta,'ع':ain,'غ':ain,'ف':f,'ق':q,'ك':kaf,'ل':lam,'م':mim,'ن':nun,'ه':ha,'ي':ya,...single,'ذ':single['د'],'ز':single['ر']};
function dot(x,y){return `M${x-2} ${y} L${x+2} ${y}`;}
function dots(char,form){
 const isolated=form==='isolated'||form==='final';
 const map={'ب':[[250,245]],'ت':[[245,135],[270,135]],'ث':[[245,135],[270,135],[257,112]],'ج':[[260,isolated?240:240]],'خ':[[295,105]],'ذ':[[290,110]],'ز':[[300,130]],'ش':[[300,135],[325,135],[313,112]],'ض':[[320,120]],'ظ':[[305,115]],'غ':[[290,100]],'ف':[[330,105]],'ق':[[320,100],[345,100]],'ن':[[isolated?260:310,isolated?165:125]],'ي':[[230,isolated?300:250],[255,isolated?300:250]]};
 return (map[char]||[]).map(([x,y])=>dot(x,y));
}
export function writingPaths(char,form){return [...(families[char]?.[form]||[]),...dots(char,form)];}
