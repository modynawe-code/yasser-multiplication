#!/usr/bin/env python3
import difflib
import hashlib
import json
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import pymupdf
import pytesseract
import requests
from PIL import Image, ImageDraw
from pytesseract import Output

BOOK_URL = "https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf"
OUT_DIR = Path("preview-v4/assets/science/yasser/book")
MANIFEST_PATH = Path("preview-v4/src/modules/yasser/science/science-book-visuals.generated.js")
CONTACT_SHEET = Path("/tmp/science-textbook-contact-sheet.jpg")
RENDER_SCALE = 2.15

TARGETS = {
    "organization-levels": {"phrases":["مستويات التنظيم","كيف تنتظم أجسام المخلوقات الحية","الجهاز الحيوي"],"pages":[18,32],"window":1300,"bias":180,"min_w":700,"min_h":260},
    "heart": {"phrases":["القلب","عضو"],"pages":[18,32],"window":1050,"bias":80,"min_w":280,"min_h":220},
    "tissues": {"phrases":["الأنسجة","النسيج"],"pages":[18,32],"window":1150,"bias":100,"min_w":500,"min_h":260},
    "water-cell-components": {"phrases":["مكونات خلايا الإنسان","الماء"],"pages":[18,32],"window":1150,"bias":120,"min_w":420,"min_h":260},
    "cell-comparison": {"phrases":["الخلية النباتية والخلية الحيوانية","الخلية النباتية","الخلية الحيوانية"],"pages":[33,45],"window":1600,"bias":360,"min_w":900,"min_h":500},
    "plant-cell-parts": {"phrases":["الخلية النباتية","الجدار الخلوي","البلاستيدات الخضراء"],"pages":[33,45],"window":1350,"bias":240,"min_w":520,"min_h":420},
    "animal-cell-parts": {"phrases":["الخلية الحيوانية","الغشاء البلازمي"],"pages":[33,45],"window":1350,"bias":240,"min_w":520,"min_h":420},
    "cell-wall-membrane": {"phrases":["الجدار الخلوي","الغشاء البلازمي"],"pages":[33,45],"window":1050,"bias":170,"min_w":400,"min_h":280},
    "chloroplast-closeup": {"phrases":["البلاستيدات الخضراء","البلاستيدة الخضراء"],"pages":[33,45],"window":1000,"bias":170,"min_w":300,"min_h":240},
    "mitochondria-closeup": {"phrases":["الميتوكندريا"],"pages":[33,45],"window":1000,"bias":170,"min_w":300,"min_h":240},
    "nucleus-closeup": {"phrases":["النواة"],"pages":[33,45],"window":1000,"bias":170,"min_w":300,"min_h":240},
    "vacuole-plant": {"phrases":["الفجوات","الفجوة"],"pages":[33,45],"window":1000,"bias":170,"min_w":300,"min_h":240},
    "diffusion-gradient": {"phrases":["الانتشار"],"pages":[40,50],"window":1050,"bias":180,"min_w":450,"min_h":260},
    "osmosis-membrane": {"phrases":["الخاصية الأسموزية","الأسموزية"],"pages":[40,50],"window":1050,"bias":180,"min_w":450,"min_h":260},
    "active-transport-energy": {"phrases":["النقل النشط"],"pages":[40,50],"window":1050,"bias":180,"min_w":450,"min_h":260},
    "passive-transport": {"phrases":["النقل السلبي"],"pages":[40,50],"window":1050,"bias":180,"min_w":450,"min_h":260},
    "photosynthesis-flow": {"phrases":["البناء الضوئي"],"pages":[45,54],"window":1250,"bias":250,"min_w":550,"min_h":340},
    "respiration-flow": {"phrases":["التنفس الخلوي"],"pages":[38,54],"window":1250,"bias":250,"min_w":550,"min_h":340},
}

ALIASES = {
    "organization-levels":"مستويات التنظيم كما تظهر في كتاب العلوم",
    "heart":"القلب ضمن مستويات التنظيم من كتاب العلوم",
    "tissues":"الأنسجة من كتاب العلوم",
    "water-cell-components":"مكونات الخلية والماء من كتاب العلوم",
    "cell-comparison":"الخلية النباتية والخلية الحيوانية من كتاب العلوم",
    "plant-cell-parts":"الخلية النباتية من كتاب العلوم",
    "animal-cell-parts":"الخلية الحيوانية من كتاب العلوم",
    "cell-wall-membrane":"الجدار الخلوي والغشاء البلازمي من كتاب العلوم",
    "chloroplast-closeup":"البلاستيدات الخضراء من كتاب العلوم",
    "mitochondria-closeup":"الميتوكندريا من كتاب العلوم",
    "nucleus-closeup":"النواة من كتاب العلوم",
    "vacuole-plant":"الفجوة في الخلية النباتية من كتاب العلوم",
    "diffusion-gradient":"الانتشار من كتاب العلوم",
    "osmosis-membrane":"الخاصية الأسموزية من كتاب العلوم",
    "active-transport-energy":"النقل النشط من كتاب العلوم",
    "passive-transport":"النقل السلبي من كتاب العلوم",
    "photosynthesis-flow":"البناء الضوئي من كتاب العلوم",
    "respiration-flow":"التنفس الخلوي من كتاب العلوم",
}

ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")

def normalize(text):
    text=ARABIC_DIACRITICS.sub("",text or "")
    text=text.replace("ـ","").replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ة","ه").replace("ى","ي")
    text=re.sub(r"[^\u0600-\u06ffA-Za-z0-9%]+"," ",text)
    return re.sub(r"\s+"," ",text).strip()

def similarity(a,b):
    if not a or not b:return 0.0
    if a==b:return 1.0
    if min(len(a),len(b))<3:return 0.0
    return difflib.SequenceMatcher(None,a,b).ratio()

def download_book():
    r=requests.get(BOOK_URL,timeout=90,headers={"User-Agent":"Mozilla/5.0 FamilyLearning/1.0"});r.raise_for_status()
    if len(r.content)<1_000_000 or not r.content.startswith(b"%PDF"):raise RuntimeError("Unexpected textbook PDF response")
    return r.content

def render_page(doc,page_index):
    pix=doc[page_index].get_pixmap(matrix=pymupdf.Matrix(RENDER_SCALE,RENDER_SCALE),alpha=False)
    return Image.frombytes("RGB",[pix.width,pix.height],pix.samples)

def ocr_page(image):
    data=pytesseract.image_to_data(image,lang="ara+eng",config="--psm 6",output_type=Output.DICT);tokens=[]
    for i,raw in enumerate(data.get("text",[])):
        text=normalize(raw)
        if not text:continue
        try:conf=float(data["conf"][i])
        except Exception:conf=0
        if conf<12:continue
        tokens.append({"text":text,"left":int(data["left"][i]),"top":int(data["top"][i]),"width":int(data["width"][i]),"height":int(data["height"][i]),"block":int(data["block_num"][i]),"line":int(data["line_num"][i]),"conf":conf})
    return tokens

def groups_by_line(tokens):
    groups={}
    for token in tokens:groups.setdefault((token["block"],token["line"]),[]).append(token)
    return list(groups.values())

def union_bbox(tokens):
    left=min(t["left"] for t in tokens);top=min(t["top"] for t in tokens);right=max(t["left"]+t["width"] for t in tokens);bottom=max(t["top"]+t["height"] for t in tokens)
    return [left,top,right-left,bottom-top]

def match_phrase(tokens,phrase):
    words=[w for w in normalize(phrase).split() if w]
    if not words:return None
    best=None
    for line_tokens in groups_by_line(tokens):
        matched=[];sims=[]
        for word in words:
            token=max(line_tokens,key=lambda t:similarity(word,t["text"]));sim=similarity(word,token["text"]);sims.append(sim)
            if sim>=0.58:matched.append(token)
        coverage=len(matched)/len(words);score=(sum(sims)/len(sims))*coverage
        if coverage<(0.5 if len(words)>1 else 1):continue
        candidate={"score":score,"bbox":union_bbox(matched),"phrase":phrase}
        if best is None or candidate["score"]>best["score"]:best=candidate
    return best

def find_target(doc,target,cache):
    first,last=target["pages"];candidates=[]
    for page_num in range(first,min(last,doc.page_count)+1):
        index=page_num-1
        if index not in cache:
            image=render_page(doc,index);cache[index]={"image":image,"tokens":ocr_page(image)}
        for phrase in target["phrases"]:
            hit=match_phrase(cache[index]["tokens"],phrase)
            if hit and hit["score"]>=0.48:candidates.append({**hit,"page_index":index})
    if not candidates:return None
    candidates.sort(key=lambda x:x["score"],reverse=True);return candidates[0]

def local_window(image,match,target):
    _,ty,_,th=match["bbox"];center=ty+th/2+target.get("bias",0);height=min(int(target.get("window",1100)),image.height-100)
    top=max(40,int(center-height/2));bottom=min(image.height-40,top+height)
    if bottom-top<height:top=max(40,bottom-height)
    margin=max(45,int(image.width*0.03));return [margin,top,image.width-margin,bottom]

def mask_text(mask,tokens,window):
    left,top,right,bottom=window
    for token in tokens:
        x0=token["left"]-left;y0=token["top"]-top;x1=x0+token["width"];y1=y0+token["height"]
        if x1<0 or y1<0 or x0>=right-left or y0>=bottom-top:continue
        pad=8;cv2.rectangle(mask,(max(0,x0-pad),max(0,y0-pad)),(min(mask.shape[1]-1,x1+pad),min(mask.shape[0]-1,y1+pad)),0,-1)

def merge_nearby_boxes(boxes,max_gap=55):
    boxes=[list(map(int,b)) for b in boxes];changed=True
    while changed:
        changed=False;out=[]
        while boxes:
            a=boxes.pop(0);ax,ay,aw,ah=a;ax2,ay2=ax+aw,ay+ah;merged=False
            for i,b in enumerate(boxes):
                bx,by,bw,bh=b;bx2,by2=bx+bw,by+bh
                h_overlap=max(0,min(ay2,by2)-max(ay,by))/max(1,min(ah,bh));v_overlap=max(0,min(ax2,bx2)-max(ax,bx))/max(1,min(aw,bw))
                x_gap=max(0,max(ax,bx)-min(ax2,bx2));y_gap=max(0,max(ay,by)-min(ay2,by2))
                if (h_overlap>0.25 and x_gap<max_gap) or (v_overlap>0.25 and y_gap<max_gap):
                    nx,ny=min(ax,bx),min(ay,by);nx2,ny2=max(ax2,bx2),max(ay2,by2);boxes[i]=[nx,ny,nx2-nx,ny2-ny];changed=True;merged=True;break
            if not merged:out.append(a)
        boxes=out
    return boxes

def detect_figure_bbox(page_image,tokens,match,target):
    window=local_window(page_image,match,target);left,top,right,bottom=window
    patch=np.asarray(page_image.crop(window)).copy();hsv=cv2.cvtColor(patch,cv2.COLOR_RGB2HSV);gray=cv2.cvtColor(patch,cv2.COLOR_RGB2GRAY)
    sat=hsv[:,:,1];val=hsv[:,:,2];mask=((sat>28)|(gray<218)|(val<210)).astype(np.uint8)*255
    mask_text(mask,tokens,window);mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_RECT,(3,3)));mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_RECT,(11,11)),iterations=2);mask=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_RECT,(7,7)),iterations=1)
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);ph,pw=mask.shape;boxes=[]
    for contour in contours:
        x,y,w,h=cv2.boundingRect(contour);area=w*h
        if w<120 or h<90 or area<pw*ph*0.006:continue
        if w>pw*0.93 and h>ph*0.68:continue
        if h<55 and w>pw*0.55:continue
        boxes.append([x,y,w,h])
    boxes=merge_nearby_boxes(boxes,max_gap=max(45,int(pw*0.025)))
    # Merging can accidentally recreate a page strip; filter again.
    boxes=[b for b in boxes if not (b[2]>pw*0.93 and b[3]>ph*0.68)]
    if not boxes:return None,window
    target_y=(match["bbox"][1]+match["bbox"][3]/2+target.get("bias",0))-top;scored=[]
    for box in boxes:
        x,y,w,h=box;area=(w*h)/(pw*ph);cy=y+h/2;prox=abs(cy-target_y)/max(ph,1);edge=(0.25 if x<10 or x+w>pw-10 else 0)+(0.18 if y<10 or y+h>ph-10 else 0);skinny=0.3 if (w/h>6 or h/w>5) else 0
        score=area*3.6+(1-min(prox,1))*1.1-edge-skinny
        if w>=target.get("min_w",0) and h>=target.get("min_h",0):score+=0.35
        scored.append((score,box))
    scored.sort(reverse=True,key=lambda item:item[0]);best=scored[0][1];selected=[best]
    for _,box in scored[1:5]:
        bx,by,bw,bh=box
        if bw*bh<pw*ph*0.015:continue
        sx=min(b[0] for b in selected);sy=min(b[1] for b in selected);sx2=max(b[0]+b[2] for b in selected);sy2=max(b[1]+b[3] for b in selected)
        vertical=max(0,min(sy2,by+bh)-max(sy,by))/max(1,min(sy2-sy,bh));horizontal=max(0,min(sx2,bx+bw)-max(sx,bx))/max(1,min(sx2-sx,bw));gapx=max(0,max(sx,bx)-min(sx2,bx+bw));gapy=max(0,max(sy,by)-min(sy2,by+bh))
        if not ((vertical>0.3 and gapx<pw*0.08) or (horizontal>0.3 and gapy<ph*0.08)):continue
        ux=min(sx,bx);uy=min(sy,by);ux2=max(sx2,bx+bw);uy2=max(sy2,by+bh)
        if ux2-ux>pw*0.90 or uy2-uy>ph*0.80:continue
        selected.append(box)
    sx=min(b[0] for b in selected);sy=min(b[1] for b in selected);sx2=max(b[0]+b[2] for b in selected);sy2=max(b[1]+b[3] for b in selected);pad=max(22,int(min(pw,ph)*0.025));sx=max(0,sx-pad);sy=max(0,sy-pad);sx2=min(pw,sx2+pad);sy2=min(ph,sy2+pad)
    return [left+sx,top+sy,sx2-sx,sy2-sy],window

def crop_figure(page_image,tokens,match,target):
    bbox,window=detect_figure_bbox(page_image,tokens,match,target)
    if bbox is None:
        # Controlled fallback: crop a centered region around the matched lesson term, never a full page strip.
        l,t,r,b=window;cw=min(int((r-l)*0.78),1600);ch=min(int((b-t)*0.62),850);cx=(l+r)//2;cy=int(match["bbox"][1]+match["bbox"][3]/2+target.get("bias",0));x=max(l,cx-cw//2);y=max(t,cy-ch//2);x=min(x,r-cw);y=min(y,b-ch);bbox=[x,y,cw,ch]
    x,y,w,h=bbox
    if w>page_image.width*0.93 and h>page_image.height*0.36:raise RuntimeError(f"Unsafe page-strip crop {w}x{h}")
    return page_image.crop((x,y,x+w,y+h)),bbox

def js(value):return json.dumps(value,ensure_ascii=False)

def write_manifest(records):
    lines=["// Generated from the Saudi Grade 6 science textbook. Do not hand-edit.",f"export const YASSER_SCIENCE_BOOK_SOURCE=Object.freeze({{label:'كتاب العلوم سادس ابتدائي ف1',kind:'textbook-exact',authority:'textbook',url:{js(BOOK_URL)}}});","export const YASSER_SCIENCE_BOOK_VISUAL_ASSETS=Object.freeze({"]
    for r in records:
        b=r["bbox"];lines.append(f"  {js(r['id'])}:Object.freeze({{id:{js(r['id'])},src:{js(r['src'])},alt:{js(r['alt'])},source:Object.freeze({{...YASSER_SCIENCE_BOOK_SOURCE,page:{r['page']},bbox:Object.freeze([{b[0]},{b[1]},{b[2]},{b[3]}]),sha256:{js(r['sha256'])}}})}}),")
    lines += ["});",""];MANIFEST_PATH.write_text("\n".join(lines),encoding="utf-8")

def make_contact_sheet(records):
    thumbs=[]
    for r in records:
        img=Image.open(OUT_DIR/f"{r['id']}.webp").convert("RGB");img.thumbnail((480,300));tile=Image.new("RGB",(500,350),"white");tile.paste(img,((500-img.width)//2,30));draw=ImageDraw.Draw(tile);draw.text((10,8),f"{r['id']} | p{r['page']}",fill="black");thumbs.append(tile)
    cols=3;rows=math.ceil(len(thumbs)/cols);sheet=Image.new("RGB",(cols*500,rows*350),(235,235,235))
    for i,tile in enumerate(thumbs):sheet.paste(tile,((i%cols)*500,(i//cols)*350))
    sheet.save(CONTACT_SHEET,"JPEG",quality=88)

def main():
    pdf=download_book();doc=pymupdf.open(stream=pdf,filetype="pdf")
    if doc.page_count<100:raise RuntimeError(f"Unexpected page count: {doc.page_count}")
    OUT_DIR.mkdir(parents=True,exist_ok=True);MANIFEST_PATH.parent.mkdir(parents=True,exist_ok=True);cache={};records=[];missing=[]
    for asset_id,target in TARGETS.items():
        hit=find_target(doc,target,cache)
        if not hit:missing.append(asset_id);print(f"MISS {asset_id}");continue
        payload=cache[hit["page_index"]];crop,bbox=crop_figure(payload["image"],payload["tokens"],hit,target);path=OUT_DIR/f"{asset_id}.webp";crop.save(path,"WEBP",quality=96,method=6);sha=hashlib.sha256(path.read_bytes()).hexdigest();record={"id":asset_id,"src":f"assets/science/yasser/book/{asset_id}.webp","alt":ALIASES[asset_id],"page":hit["page_index"]+1,"bbox":bbox,"sha256":sha,"width":crop.width,"height":crop.height,"matched_phrase":hit["phrase"],"ocr_score":round(hit["score"],3)};records.append(record);print(f"OK {asset_id}: p{record['page']} {crop.width}x{crop.height} {hit['phrase']} score={hit['score']:.2f}")
    if len(records)<15:raise RuntimeError(f"Only {len(records)} textbook figures found; missing={missing}")
    unique=len({r["sha256"] for r in records})
    if unique<17:raise RuntimeError(f"Only {unique} unique textbook figures; refusing weak import")
    overly_large=[r["id"] for r in records if r["width"]>2000 and r["height"]>900]
    if overly_large:raise RuntimeError(f"Page-strip crops remain: {overly_large}")
    write_manifest(records);make_contact_sheet(records);(OUT_DIR/"manifest.json").write_text(json.dumps({"source":BOOK_URL,"pdf_sha256":hashlib.sha256(pdf).hexdigest(),"page_count":doc.page_count,"assets":records,"missing":missing,"unique":unique},ensure_ascii=False,indent=2),encoding="utf-8");print(f"Extracted {len(records)} focused textbook figures ({unique} unique).")

if __name__=="__main__":
    try:main()
    except Exception as exc:print(f"ERROR: {exc}",file=sys.stderr);raise
