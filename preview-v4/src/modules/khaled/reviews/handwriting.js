export function bindReviewHandwriting({canvas,clearButton,strokes,onChange,disabled=false}){
 const ctx=canvas.getContext('2d');let current=null;
 const paint=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#182b49';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}};
 paint();
 const point=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height];};
 if(!disabled){canvas.onpointerdown=e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);current=[point(e)];strokes.push(current);};canvas.onpointermove=e=>{if(!current)return;current.push(point(e));paint();};const finish=()=>{if(!current)return;if(current.length===1)current.push([current[0][0]+1,current[0][1]+1]);current=null;paint();onChange(strokes);};canvas.onpointerup=finish;canvas.onpointercancel=finish;clearButton.onclick=()=>{strokes.splice(0);paint();onChange(strokes);};}
 clearButton.disabled=disabled;canvas.setAttribute('aria-disabled',String(disabled));
 return {image:()=>canvas.toDataURL('image/png')};
}
