#!/usr/bin/env python3
import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf
import pytesseract
import requests
from PIL import Image
from pytesseract import Output

BOOK_URL = "https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf"
OUT_DIR = Path("preview-v4/assets/science/yasser/book")
MANIFEST_PATH = Path("preview-v4/src/modules/yasser/science/science-book-visuals.generated.js")
RENDER_SCALE = 2.15

# Pages are PDF page numbers (1-based). Restricting each target to its actual lesson
# prevents an OCR match in later units from being mistaken for a chapter-one figure.
TARGETS = {
    "organization-levels": {"phrases":["مستويات التنظيم","كيف تنتظم أجسام المخلوقات الحية","الجهاز الحيوي"],"pages":[18,32],"height":1180,"bias":140},
    "heart": {"phrases":["القلب","عضو"],"pages":[18,32],"height":980,"bias":0},
    "tissues": {"phrases":["الأنسجة","النسيج"],"pages":[18,32],"height":1100,"bias":0},
    "water-cell-components": {"phrases":["مكونات خلايا الإنسان","الماء"],"pages":[18,32],"height":1050,"bias":0},
    "cell-comparison": {"phrases":["الخلية النباتية والخلية الحيوانية","الخلية النباتية","الخلية الحيوانية"],"pages":[33,45],"height":1450,"bias":250},
    "plant-cell-parts": {"phrases":["الخلية النباتية","الجدار الخلوي","البلاستيدات الخضراء"],"pages":[33,45],"height":1150,"bias":80},
    "animal-cell-parts": {"phrases":["الخلية الحيوانية","الغشاء البلازمي"],"pages":[33,45],"height":1150,"bias":80},
    "cell-wall-membrane": {"phrases":["الجدار الخلوي","الغشاء البلازمي"],"pages":[33,45],"height":900,"bias":0},
    "chloroplast-closeup": {"phrases":["البلاستيدات الخضراء","البلاستيدة الخضراء"],"pages":[33,45],"height":900,"bias":0},
    "mitochondria-closeup": {"phrases":["الميتوكندريا"],"pages":[33,45],"height":900,"bias":0},
    "nucleus-closeup": {"phrases":["النواة"],"pages":[33,45],"height":900,"bias":0},
    "vacuole-plant": {"phrases":["الفجوات","الفجوة"],"pages":[33,45],"height":900,"bias":0},
    "diffusion-gradient": {"phrases":["الانتشار"],"pages":[40,50],"height":1000,"bias":80},
    "osmosis-membrane": {"phrases":["الخاصية الأسموزية","الأسموزية"],"pages":[40,50],"height":1000,"bias":80},
    "active-transport-energy": {"phrases":["النقل النشط"],"pages":[40,50],"height":1000,"bias":80},
    "passive-transport": {"phrases":["النقل السلبي"],"pages":[40,50],"height":1000,"bias":80},
    "photosynthesis-flow": {"phrases":["البناء الضوئي"],"pages":[45,54],"height":1150,"bias":160},
    "respiration-flow": {"phrases":["التنفس الخلوي"],"pages":[38,54],"height":1150,"bias":160},
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
    text = ARABIC_DIACRITICS.sub("", text or "")
    text = text.replace("ـ", "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه").replace("ى", "ي")
    text = re.sub(r"[^\u0600-\u06ffA-Za-z0-9%]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def similarity(a,b):
    if not a or not b: return 0.0
    if a == b: return 1.0
    if min(len(a),len(b)) < 3: return 0.0
    return difflib.SequenceMatcher(None,a,b).ratio()

def download_book():
    r = requests.get(BOOK_URL, timeout=90, headers={"User-Agent":"Mozilla/5.0 FamilyLearning/1.0"})
    r.raise_for_status()
    if len(r.content) < 1_000_000 or not r.content.startswith(b"%PDF"):
        raise RuntimeError("Unexpected textbook PDF response")
    return r.content

def render_page(doc,page_index):
    pix = doc[page_index].get_pixmap(matrix=pymupdf.Matrix(RENDER_SCALE,RENDER_SCALE),alpha=False)
    return Image.frombytes("RGB",[pix.width,pix.height],pix.samples)

def ocr_page(image):
    data = pytesseract.image_to_data(image,lang="ara+eng",config="--psm 6",output_type=Output.DICT)
    tokens=[]
    for i,raw in enumerate(data.get("text",[])):
        text=normalize(raw)
        if not text: continue
        try: conf=float(data["conf"][i])
        except Exception: conf=0
        if conf < 12: continue
        tokens.append({
            "text":text,"left":int(data["left"][i]),"top":int(data["top"][i]),
            "width":int(data["width"][i]),"height":int(data["height"][i]),
            "block":int(data["block_num"][i]),"line":int(data["line_num"][i]),"conf":conf
        })
    return tokens

def groups_by_line(tokens):
    groups={}
    for token in tokens:
        groups.setdefault((token["block"],token["line"]),[]).append(token)
    return list(groups.values())

def union_bbox(tokens):
    left=min(t["left"] for t in tokens); top=min(t["top"] for t in tokens)
    right=max(t["left"]+t["width"] for t in tokens); bottom=max(t["top"]+t["height"] for t in tokens)
    return [left,top,right-left,bottom-top]

def match_phrase(tokens,phrase):
    words=[w for w in normalize(phrase).split() if w]
    if not words: return None
    best=None
    for line_tokens in groups_by_line(tokens):
        matched=[]; sims=[]
        for word in words:
            token=max(line_tokens,key=lambda t:similarity(word,t["text"]))
            sim=similarity(word,token["text"]); sims.append(sim)
            if sim>=0.58: matched.append(token)
        coverage=len(matched)/len(words)
        score=(sum(sims)/len(sims))*coverage
        if coverage < (0.5 if len(words)>1 else 1): continue
        candidate={"score":score,"bbox":union_bbox(matched),"phrase":phrase}
        if best is None or candidate["score"]>best["score"]: best=candidate
    return best

def find_target(doc,target,cache):
    first,last=target["pages"]
    candidates=[]
    for page_num in range(first,min(last,doc.page_count)+1):
        index=page_num-1
        if index not in cache:
            image=render_page(doc,index); cache[index]={"image":image,"tokens":ocr_page(image)}
        tokens=cache[index]["tokens"]
        for phrase in target["phrases"]:
            hit=match_phrase(tokens,phrase)
            if hit and hit["score"]>=0.48:
                candidates.append({**hit,"page_index":index})
    if not candidates: return None
    candidates.sort(key=lambda x:x["score"],reverse=True)
    return candidates[0]

def crop_exact_excerpt(image,match,target):
    _,ty,_,th=match["bbox"]
    center_y=ty+th/2+target.get("bias",0)
    height=min(int(target.get("height",1000)),image.height-80)
    top=max(30,int(center_y-height/2)); bottom=min(image.height-30,top+height)
    if bottom-top < height:
        top=max(30,bottom-height)
    # Keep the page width so the original diagram geometry/labels are never redrawn.
    margin=max(30,int(image.width*0.035))
    return image.crop((margin,top,image.width-margin,bottom)),[margin,top,image.width-2*margin,bottom-top]

def js(value): return json.dumps(value,ensure_ascii=False)

def write_manifest(records):
    lines=[
        "// Generated from the Saudi Grade 6 science textbook. Do not hand-edit.",
        f"export const YASSER_SCIENCE_BOOK_SOURCE=Object.freeze({{label:'كتاب العلوم سادس ابتدائي ف1',kind:'textbook-exact',authority:'textbook',url:{js(BOOK_URL)}}});",
        "export const YASSER_SCIENCE_BOOK_VISUAL_ASSETS=Object.freeze({"
    ]
    for r in records:
        b=r["bbox"]
        lines.append(f"  {js(r['id'])}:Object.freeze({{id:{js(r['id'])},src:{js(r['src'])},alt:{js(r['alt'])},source:Object.freeze({{...YASSER_SCIENCE_BOOK_SOURCE,page:{r['page']},bbox:Object.freeze([{b[0]},{b[1]},{b[2]},{b[3]}]),sha256:{js(r['sha256'])}}})}}),")
    lines += ["});",""]
    MANIFEST_PATH.write_text("\n".join(lines),encoding="utf-8")

def main():
    pdf=download_book(); doc=pymupdf.open(stream=pdf,filetype="pdf")
    if doc.page_count<100: raise RuntimeError(f"Unexpected page count: {doc.page_count}")
    OUT_DIR.mkdir(parents=True,exist_ok=True); MANIFEST_PATH.parent.mkdir(parents=True,exist_ok=True)
    cache={}; records=[]; missing=[]
    for asset_id,target in TARGETS.items():
        hit=find_target(doc,target,cache)
        if not hit:
            missing.append(asset_id); print(f"MISS {asset_id}"); continue
        image=cache[hit["page_index"]]["image"]
        crop,bbox=crop_exact_excerpt(image,hit,target)
        path=OUT_DIR/f"{asset_id}.webp"; crop.save(path,"WEBP",quality=96,method=6)
        sha=hashlib.sha256(path.read_bytes()).hexdigest()
        record={"id":asset_id,"src":f"assets/science/yasser/book/{asset_id}.webp","alt":ALIASES[asset_id],"page":hit["page_index"]+1,"bbox":bbox,"sha256":sha,"width":crop.width,"height":crop.height,"matched_phrase":hit["phrase"],"ocr_score":round(hit["score"],3)}
        records.append(record); print(f"OK {asset_id}: p{record['page']} {crop.width}x{crop.height} {hit['phrase']} score={hit['score']:.2f}")
    if len(records)<15: raise RuntimeError(f"Only {len(records)} textbook excerpts found; missing={missing}")
    unique=len({r["sha256"] for r in records})
    if unique<10: raise RuntimeError(f"Only {unique} unique textbook excerpts; refusing weak import")
    write_manifest(records)
    (OUT_DIR/"manifest.json").write_text(json.dumps({"source":BOOK_URL,"pdf_sha256":hashlib.sha256(pdf).hexdigest(),"page_count":doc.page_count,"assets":records,"missing":missing,"unique":unique},ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Extracted {len(records)} textbook excerpts ({unique} unique).")

if __name__=="__main__":
    try: main()
    except Exception as exc:
        print(f"ERROR: {exc}",file=sys.stderr); raise
