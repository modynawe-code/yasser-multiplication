import { MASHAAL_ARABIC_COLORING_PAGES,MASHAAL_ARABIC_COLORING_SOURCE,getMashaalArabicColoringPage } from '../curriculum/arabic-coloring-pages.js';
import { createMashaalArabicProgress } from '../application/arabic-progress.js';
import { createMashaalArabicLetterAudioPlayer } from '../curriculum/arabic-letter-audio.js';

const progress=createMashaalArabicProgress();
const letterAudio=createMashaalArabicLetterAudioPlayer();

function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
}

function pageCard(page){
  const button=node('button','mashaal-coloring-page-card');
  button.type='button';
  button.dataset.letterId=page.letterId;
  const image=document.createElement('img');
  image.src=page.image;
  image.alt=page.word;
  image.loading='lazy';
  image.decoding='async';
  button.append(image,node('strong','',page.letter+' — '+page.word),node('small','', 'لوّني '+page.word));
  return button;
}

function sourceCredit(){
  const note=node('p','mashaal-coloring-credit');
  note.append(document.createTextNode('رسومات التلوين: '+MASHAAL_ARABIC_COLORING_SOURCE.title+' · '));
  const link=node('a','',MASHAAL_ARABIC_COLORING_SOURCE.license);
  link.href=MASHAAL_ARABIC_COLORING_SOURCE.licenseUrl;
  link.target='_blank';
  link.rel='noopener noreferrer';
  note.appendChild(link);
  return note;
}

export function mountMashaalArabicColoring(host,{initialLetterId}={}){
  if(!host)return Object.freeze({destroy(){}});
  const start=getMashaalArabicColoringPage(initialLetterId)||MASHAAL_ARABIC_COLORING_PAGES[0];
  const shell=node('div','mashaal-coloring-shell');
  const chooser=node('div','mashaal-coloring-chooser');
  const work=node('div','mashaal-coloring-work');
  shell.append(chooser,work);
  host.appendChild(shell);

  let current=start;
  let ctx=null,canvas=null,painting=false,last=null,brush='#df5c89',brushWidth=30,eraser=false;
  const history=[];
  let destroyed=false;

  for(const page of MASHAAL_ARABIC_COLORING_PAGES){
    const card=pageCard(page);
    card.addEventListener('click',()=>openPage(page));
    chooser.appendChild(card);
  }

  function markSelected(){
    chooser.querySelectorAll('[data-letter-id]').forEach(card=>{
      card.dataset.selected=String(card.dataset.letterId===current.letterId);
    });
  }

  function point(event){
    const rect=canvas.getBoundingClientRect();
    return {
      x:(event.clientX-rect.left)*(canvas.width/Math.max(1,rect.width)),
      y:(event.clientY-rect.top)*(canvas.height/Math.max(1,rect.height))
    };
  }

  function snapshot(){
    try{
      history.push(ctx.getImageData(0,0,canvas.width,canvas.height));
      if(history.length>12)history.shift();
    }catch{}
  }

  function startDraw(event){
    snapshot();
    painting=true;
    last=point(event);
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveDraw(event){
    if(!painting)return;
    const next=point(event);
    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.lineWidth=brushWidth;
    if(eraser){
      ctx.globalCompositeOperation='destination-out';
      ctx.strokeStyle='rgba(0,0,0,1)';
    }else{
      ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle=brush;
    }
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(next.x,next.y);
    ctx.stroke();
    ctx.restore();
    last=next;
    event.preventDefault();
  }

  function endDraw(event){
    painting=false;
    last=null;
    try{canvas.releasePointerCapture?.(event.pointerId);}catch{}
  }

  function clearPainting(){
    snapshot();
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function undo(){
    const previous=history.pop();
    if(previous)ctx.putImageData(previous,0,0);
  }

  function openPage(page){
    current=page;
    progress.record(page.letterId,'view');
    letterAudio.stop();
    history.length=0;
    work.innerHTML='';
    markSelected();

    const heading=node('div','mashaal-coloring-heading');
    const letter=node('span','mashaal-coloring-letter',page.letter);
    const copy=node('div','mashaal-coloring-heading-copy');
    copy.append(node('h3','', 'لوّني '+page.word),node('p','', 'حرف '+page.letterName+' — '+page.word));
    heading.append(letter,copy);

    const board=node('div','mashaal-coloring-board');
    canvas=document.createElement('canvas');
    canvas.className='mashaal-coloring-paint';
    canvas.width=720;
    canvas.height=520;
    canvas.setAttribute('aria-label','لوحة تلوين '+page.word);
    const outline=document.createElement('img');
    outline.className='mashaal-coloring-outline';
    outline.src=page.image;
    outline.alt='';
    outline.draggable=false;
    board.append(canvas,outline);
    ctx=canvas.getContext('2d');

    canvas.addEventListener('pointerdown',startDraw);
    canvas.addEventListener('pointermove',moveDraw);
    canvas.addEventListener('pointerup',endDraw);
    canvas.addEventListener('pointercancel',endDraw);

    const palette=node('div','mashaal-coloring-palette');
    const colors=['#e65585','#ef7a3b','#f0ba3d','#57b56b','#41a7c8','#5077d7','#7a5bbb','#9b5d42','#2d2d2d'];
    colors.forEach((color,index)=>{
      const swatch=node('button','mashaal-coloring-swatch');
      swatch.type='button';
      swatch.style.setProperty('--swatch',color);
      swatch.setAttribute('aria-label','اختاري لونًا');
      if(index===0)swatch.dataset.selected='true';
      swatch.addEventListener('click',()=>{
        brush=color;
        eraser=false;
        palette.querySelectorAll('button').forEach(item=>delete item.dataset.selected);
        swatch.dataset.selected='true';
        eraserButton.dataset.active='false';
      });
      palette.appendChild(swatch);
    });

    const tools=node('div','mashaal-coloring-tools');
    const undoButton=node('button','mashaal-arabic-tool','↶ تراجع');
    undoButton.type='button';undoButton.addEventListener('click',undo);
    const clearButton=node('button','mashaal-arabic-tool','↻ مسح');
    clearButton.type='button';clearButton.addEventListener('click',clearPainting);
    const eraserButton=node('button','mashaal-arabic-tool','⌫ ممحاة');
    eraserButton.type='button';eraserButton.addEventListener('click',()=>{
      eraser=!eraser;
      eraserButton.dataset.active=String(eraser);
    });
    const hearButton=node('button','mashaal-arabic-tool','🔊 اسمعي الحرف');
    hearButton.type='button';hearButton.addEventListener('click',()=>letterAudio.play(page.letterId));
    tools.append(undoButton,clearButton,eraserButton,hearButton);

    const sizes=node('div','mashaal-coloring-sizes');
    [[18,'صغير'],[30,'وسط'],[46,'كبير']].forEach(([size,label])=>{
      const button=node('button','mashaal-arabic-size',label);
      button.type='button';
      if(size===30)button.dataset.selected='true';
      button.addEventListener('click',()=>{
        brushWidth=size;
        sizes.querySelectorAll('button').forEach(item=>delete item.dataset.selected);
        button.dataset.selected='true';
      });
      sizes.appendChild(button);
    });

    work.append(heading,board,palette,tools,sizes,sourceCredit());
  }

  openPage(start);

  return Object.freeze({
    destroy(){
      destroyed=true;
      letterAudio.stop();
      if(canvas){
        canvas.removeEventListener('pointerdown',startDraw);
        canvas.removeEventListener('pointermove',moveDraw);
        canvas.removeEventListener('pointerup',endDraw);
        canvas.removeEventListener('pointercancel',endDraw);
      }
      if(!destroyed)return;
      host.innerHTML='';
    }
  });
}
