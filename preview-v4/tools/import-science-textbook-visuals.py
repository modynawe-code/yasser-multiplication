#!/usr/bin/env python3
import hashlib
import json
import math
from pathlib import Path

import pymupdf
import requests
from PIL import Image, ImageDraw

BOOK_URL='https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf'
OUT_DIR=Path('preview-v4/assets/science/yasser/book')
MANIFEST_PATH=Path('preview-v4/src/modules/yasser/science/science-book-visuals.generated.js')
CONTACT_SHEET=Path('/tmp/science-textbook-contact-sheet.jpg')
RENDER_SCALE=1.8
REFERENCE_SIZE=(1944,2506)

# Hand-verified against rendered pages from the same textbook PDF.
# Coordinates are based on a 1944x2506 render at 1.8x and scaled if needed.
CROPS={
    'cell-summary':{'page':22,'box':(260,465,615,755),'alt':'صورة خلية من ملخص مفردات الفصل في كتاب العلوم'},
    'tissue-summary':{'page':22,'box':(260,755,615,1025),'alt':'صورة مجهرية لنسيج من كتاب العلوم'},
    'organ-system-summary':{'page':22,'box':(260,1040,615,1325),'alt':'صورة جهاز حيوي تضم القلب والرئتين من كتاب العلوم'},
    'passive-transport-summary':{'page':22,'box':(260,1355,615,1630),'alt':'رسم النقل السلبي من كتاب العلوم'},
    'osmosis-summary':{'page':22,'box':(260,1675,615,1955),'alt':'رسم الخاصية الأسموزية من كتاب العلوم'},
    'active-transport-summary':{'page':22,'box':(260,1995,615,2280),'alt':'رسم النقل النشط من كتاب العلوم'},
    'volvox':{'page':26,'box':(125,115,730,760),'alt':'صورة مستعمرة الفولفكس من كتاب العلوم'},
    'paramecium':{'page':26,'box':(1120,95,1765,735),'alt':'صورة البراميسيوم من كتاب العلوم'},
    'tissue-types':{'page':27,'box':(1030,915,1930,2260),'alt':'صور أنواع الأنسجة الحيوانية من كتاب العلوم'},
    'animal-cell':{'page':35,'box':(55,1510,1930,2480),'alt':'رسم الخلية الحيوانية كما يظهر في كتاب العلوم'},
    'plant-cell':{'page':36,'box':(20,120,1920,930),'alt':'رسم الخلية النباتية كما يظهر في كتاب العلوم'},
    'osmosis-large':{'page':37,'box':(55,230,1040,980),'alt':'رسم الخاصية الأسموزية مع النبات من كتاب العلوم'},
    'diffusion-large':{'page':37,'box':(1040,1190,1925,2260),'alt':'رسم الانتشار قبل وبعد من كتاب العلوم'},
    'photosynthesis-diagram':{'page':39,'box':(45,0,995,2460),'alt':'مخطط البناء الضوئي من كتاب العلوم'},
    'photosynthesis-respiration-table':{'page':40,'box':(185,235,935,1190),'alt':'جدول مقارنة البناء الضوئي والتنفس من كتاب العلوم'},
    'photosynthesis-respiration-cycle':{'page':40,'box':(940,180,1920,1050),'alt':'مخطط العلاقة بين البناء الضوئي والتنفس من كتاب العلوم'},
    'amoeba-engulfing':{'page':41,'box':(260,20,1775,790),'alt':'صورة الأميبا وهي تبتلع الغذاء من كتاب العلوم'},
    'active-transport-large':{'page':41,'box':(245,1005,1035,1620),'alt':'رسم النقل النشط عبر الغشاء من كتاب العلوم'},
}


def download_book():
    response=requests.get(BOOK_URL,timeout=90,headers={'User-Agent':'Mozilla/5.0 FamilyLearning/1.0'})
    response.raise_for_status()
    data=response.content
    if len(data)<1_000_000 or not data.startswith(b'%PDF'):
        raise RuntimeError('Unexpected textbook PDF response')
    return data


def render_page(doc,page_number):
    pix=doc[page_number-1].get_pixmap(matrix=pymupdf.Matrix(RENDER_SCALE,RENDER_SCALE),alpha=False)
    return Image.frombytes('RGB',[pix.width,pix.height],pix.samples)


def scale_box(box,size):
    rw,rh=REFERENCE_SIZE;w,h=size
    sx=w/rw;sy=h/rh
    x1,y1,x2,y2=box
    return (round(x1*sx),round(y1*sy),round(x2*sx),round(y2*sy))


def js(value):
    return json.dumps(value,ensure_ascii=False)


def write_manifest(records):
    lines=[
        '// Generated from hand-verified crops of the Saudi Grade 6 science textbook. Do not hand-edit.',
        f"export const YASSER_SCIENCE_BOOK_SOURCE=Object.freeze({{label:'كتاب العلوم سادس ابتدائي ف1',kind:'textbook-exact',authority:'textbook',url:{js(BOOK_URL)}}});",
        'export const YASSER_SCIENCE_BOOK_VISUAL_ASSETS=Object.freeze({'
    ]
    for record in records:
        box=record['bbox']
        lines.append(f"  {js(record['id'])}:Object.freeze({{id:{js(record['id'])},src:{js(record['src'])},alt:{js(record['alt'])},source:Object.freeze({{...YASSER_SCIENCE_BOOK_SOURCE,page:{record['page']},bbox:Object.freeze([{box[0]},{box[1]},{box[2]},{box[3]}]),sha256:{js(record['sha256'])}}})}}),")
    lines.extend(['});',''])
    MANIFEST_PATH.write_text('\n'.join(lines),encoding='utf-8')


def make_contact_sheet(records):
    tiles=[]
    for record in records:
        image=Image.open(OUT_DIR/f"{record['id']}.webp").convert('RGB')
        image.thumbnail((440,290))
        tile=Image.new('RGB',(460,335),'white')
        tile.paste(image,((460-image.width)//2,32))
        ImageDraw.Draw(tile).text((8,8),f"{record['id']} | p{record['page']}",fill='black')
        tiles.append(tile)
    cols=3;rows=math.ceil(len(tiles)/cols)
    sheet=Image.new('RGB',(cols*460,rows*335),(230,230,230))
    for index,tile in enumerate(tiles):
        sheet.paste(tile,((index%cols)*460,(index//cols)*335))
    sheet.save(CONTACT_SHEET,'JPEG',quality=90)


def main():
    pdf=download_book();doc=pymupdf.open(stream=pdf,filetype='pdf')
    if doc.page_count<100:
        raise RuntimeError(f'Unexpected page count: {doc.page_count}')
    OUT_DIR.mkdir(parents=True,exist_ok=True);MANIFEST_PATH.parent.mkdir(parents=True,exist_ok=True)
    page_cache={};records=[]
    for asset_id,spec in CROPS.items():
        page=spec['page']
        if page not in page_cache:
            page_cache[page]=render_page(doc,page)
        image=page_cache[page]
        box=scale_box(spec['box'],image.size)
        crop=image.crop(box)
        if crop.width<250 or crop.height<180:
            raise RuntimeError(f'{asset_id}: crop too small {crop.size}')
        path=OUT_DIR/f'{asset_id}.webp'
        crop.save(path,'WEBP',quality=96,method=6)
        sha=hashlib.sha256(path.read_bytes()).hexdigest()
        records.append({'id':asset_id,'src':f'assets/science/yasser/book/{asset_id}.webp','alt':spec['alt'],'page':page,'bbox':[box[0],box[1],box[2]-box[0],box[3]-box[1]],'sha256':sha,'width':crop.width,'height':crop.height})
        print(f'OK {asset_id}: page={page} size={crop.width}x{crop.height}')
    if len(records)!=18:
        raise RuntimeError(f'Expected 18 verified textbook figures, got {len(records)}')
    unique=len({record['sha256'] for record in records})
    if unique!=18:
        raise RuntimeError(f'Expected 18 unique textbook figures, got {unique}')
    write_manifest(records);make_contact_sheet(records)
    (OUT_DIR/'manifest.json').write_text(json.dumps({'source':BOOK_URL,'pdf_sha256':hashlib.sha256(pdf).hexdigest(),'page_count':doc.page_count,'assets':records,'unique':unique,'verification':'hand-verified-crops'},ensure_ascii=False,indent=2),encoding='utf-8')
    print('Extracted 18 hand-verified textbook figures.')


if __name__=='__main__':
    main()
