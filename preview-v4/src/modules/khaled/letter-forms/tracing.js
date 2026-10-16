const NS='http://www.w3.org/2000/svg';
const make=(name,attrs={})=>{const n=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function advanceCheckpoint(samples,cursor,point,tolerance=24){
 if(!samples.length)return 0;
 while(cursor<samples.length&&distance(samples[cursor],point)<=tolerance)cursor++;
 return cursor;
}
export function mountTracing(host,{paths,draft,mode='guided',onSave=()=>{},onComplete=()=>{}}){
 const svg=make('svg',{viewBox:'0 0 500 340',class:'lf-writing-board',role:'img','aria-label':'لوحة كتابة باللمس أو القلم'});
 const guides=make('g',{'aria-hidden':'true'});
 for(const y of [90,150,210,280])guides.append(make('line',{x1:25,y1:y,x2:475,y2:y,class:y===210?'lf-baseline':'lf-rule'}));
 const guideGroup=make('g',{class:'lf-guide'}),ink=make('g',{class:'lf-ink'}),marker=make('g',{'aria-hidden':'true'});
 const elements=paths.map(d=>make('path',{d,fill:'none',class:'lf-guide-path'}));
 elements.forEach(p=>guideGroup.append(p));svg.append(guides,guideGroup,ink,marker);host.replaceChildren(svg);
 const samples=elements.map(p=>{const length=p.getTotalLength(),count=Math.max(1,Math.ceil(length/5));return Array.from({length:count+1},(_,i)=>{const q=p.getPointAtLength(length*i/count);return {x:q.x,y:q.y};});});
 let index=0,cursor=0,strokes=[],current=null,pointer=null,raf=0,disposed=false;
 const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=500&&p[1]>=0&&p[1]<=340;
 if(draft?.mode===mode&&Number.isInteger(draft.index)&&draft.index>=0&&draft.index<=paths.length){
  index=draft.index;cursor=Number.isInteger(draft.cursor)?Math.max(0,Math.min(samples[index]?.length||0,draft.cursor)):0;
  strokes=Array.isArray(draft.strokes)?draft.strokes.slice(0,200).filter(s=>Array.isArray(s)&&s.length<=5000&&s.every(validPoint)):[];
 }
 function snapshot(){return {mode,index,cursor,strokes};}
 function save(){onSave(snapshot());}
 function paint(){
  ink.replaceChildren(...strokes.map(points=>make('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',class:'lf-user-line'})));
  elements.forEach((p,i)=>p.classList.toggle('lf-stroke-done',mode==='guided'&&i<index));
  marker.replaceChildren();
  if(mode==='guided'&&index<samples.length){
   const p=samples[index][Math.min(cursor,samples[index].length-1)];
   marker.append(make('circle',{cx:p.x,cy:p.y,r:13,class:'lf-start-halo'}),make('circle',{cx:p.x,cy:p.y,r:5,class:'lf-start-point'}));
   const label=make('text',{x:p.x+20,y:p.y-15,class:'lf-stroke-number'});label.textContent=String(index+1);marker.append(label);
  }
 }
 const toPoint=e=>{
  // SVG may letterbox on short landscape screens. Invert its actual transform.
  const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
  const local=p.matrixTransform(svg.getScreenCTM().inverse());
  return {x:Math.max(0,Math.min(500,local.x)),y:Math.max(0,Math.min(340,local.y))};
 };
 function add(p){
  if(mode==='guided'){
   const next=advanceCheckpoint(samples[index]||[],cursor,p);
   if(next===cursor&&cursor<(samples[index]?.length||0)&&distance(samples[index][cursor],p)>30)return;
   cursor=next;
  }
  if(current.length<5000)current.push([Math.round(p.x),Math.round(p.y)]);
 }
 function down(e){
  if(pointer!==null||e.isPrimary===false||e.button>0||strokes.length>=200)return;
  cancelAnimationFrame(raf);guideGroup.classList.remove('lf-demo');
  if(mode==='guided'&&index>=paths.length)return;
  const p=toPoint(e);
  if(mode==='guided'&&distance(samples[index][Math.min(cursor,samples[index].length-1)],p)>30)return;
  pointer=e.pointerId;current=[];strokes.push(current);svg.setPointerCapture(e.pointerId);add(p);paint();e.preventDefault();
 }
 function move(e){
  if(e.pointerId!==pointer||!current)return;
  const p=toPoint(e),last=current.at(-1);
  if(last){const n=Math.ceil(Math.hypot(p.x-last[0],p.y-last[1])/5);for(let i=1;i<=Math.min(n,100);i++)add({x:last[0]+(p.x-last[0])*i/n,y:last[1]+(p.y-last[1])*i/n});}else add(p);
  paint();e.preventDefault();
 }
 function up(e){
  if(e.pointerId!==pointer)return;
  if(e.type!=='pointercancel')move(e);
  pointer=null;current=null;
  if(mode==='guided'&&cursor>=(samples[index]?.length||Infinity)){
   index++;cursor=0;
   if(index===paths.length)onComplete();
  }
  paint();save();
 }
 svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
 function demo(){
  cancelAnimationFrame(raf);marker.replaceChildren();guideGroup.classList.add('lf-demo');
  const progress=make('path',{fill:'none',class:'lf-demo-path'}),pen=make('circle',{r:8,class:'lf-demo-pen'});marker.append(progress,pen);
  const start=performance.now(),duration=1800;
  const tick=now=>{
   if(disposed)return;
   const elapsed=(now-start)/duration,i=Math.floor(elapsed);
   if(i>=paths.length){guideGroup.classList.remove('lf-demo');paint();return;}
   const source=elements[i],len=source.getTotalLength(),part=elapsed-i,p=source.getPointAtLength(len*part);
   progress.setAttribute('d',paths[i]);progress.style.strokeDasharray=String(len);progress.style.strokeDashoffset=String(len*(1-part));
   pen.setAttribute('cx',p.x);pen.setAttribute('cy',p.y);raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
 }
 paint();
 return {
  save,
  clear(){cancelAnimationFrame(raf);guideGroup.classList.remove('lf-demo');index=0;cursor=0;strokes=[];current=null;pointer=null;paint();save();},
  showGuide(show){guideGroup.style.opacity=show?'':'0';},demo,
  destroy(){disposed=true;cancelAnimationFrame(raf);save();svg.removeEventListener('pointerdown',down);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerup',up);svg.removeEventListener('pointercancel',up);}
 };
}
