#!/usr/bin/env python3
import hashlib
import json
import math
from pathlib import Path

import pymupdf
import requests
from PIL import Image, ImageDraw

SOURCE_URL='https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf'
OUT_DIR=Path('preview-v4/assets/science/yasser/unit2')
MANIFEST_PATH=Path('preview-v4/src/modules/yasser/science/science-unit2-visuals.generated.js')
CONTACT_SHEET=Path('/tmp/science-unit2-crop-review.jpg')
RENDER_SCALE=1.8
REFERENCE_SIZE=(1944,2506)

# Crops selected for assessment value: structures/processes that appear as direct diagram questions.
CROPS={
    'u2-leaf-stomata':{'page':83,'box':(215,830,1750,2280),'alt':'مقطع ورقة نبات يوضح الثغور والخلايا الحارسة وتبادل الغازات'},
    'u2-yeast-budding':{'page':98,'box':(160,210,930,1020),'alt':'مراحل تكاثر الخميرة بالتبرعم'},
    'u2-bacteria-conjugation':{'page':98,'box':(160,1370,940,2080),'alt':'مخطط يوضح اقتران خليتين بكتيريتين وتبادل المادة الوراثية'},
    'u2-bread-mold':{'page':99,'box':(950,1410,1810,2310),'alt':'رسم عفن الخبز يوضح الخيوط الفطرية ومحافظ الأبواغ'},
    'u2-digestive-system':{'page':112,'box':(90,170,710,1500),'alt':'رسم الجهاز الهضمي في جسم الإنسان'},
    'u2-respiratory-system':{'page':114,'box':(130,480,1020,1580),'alt':'رسم الجهاز التنفسي يوضح الرئتين والحجاب الحاجز'},
    'u2-circulation':{'page':117,'box':(300,180,1660,1200),'alt':'مخطط جهاز الدوران ومسار الدم بين القلب والرئتين والجسم'},
    'u2-skeleton':{'page':123,'box':(90,1210,1690,2390),'alt':'رسم هيكل حيوان يوضح العظام والمفاصل والدعامة'},
    'u2-nervous-endocrine':{'page':125,'box':(170,350,1060,2150),'alt':'رسم يوضح الجهاز العصبي والغدد في جسم حيوان'},
}


def download_source():
    response=requests.get(SOURCE_URL,timeout=90,headers={'User-Agent':'Mozilla/5.0 FamilyLearning/1.0'})
    response.raise_for_status()
    data=response.content
    if len(data)<1_000_000 or not data.startswith(b'%PDF'):
        raise RuntimeError('Unexpected PDF response')
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
        '// Generated asset manifest. Do not hand-edit.',
        f"export const YASSER_SCIENCE_UNIT2_VISUAL_SOURCE=Object.freeze({{label:'علوم سادس - الوحدة الثانية',kind:'verified-curriculum-visual',authority:'textbook',url:{js(SOURCE_URL)}}});",
        'export const YASSER_SCIENCE_UNIT2_VISUAL_ASSETS=Object.freeze({'
    ]
    for record in records:
        box=record['bbox']
        lines.append(f"  {js(record['id'])}:Object.freeze({{id:{js(record['id'])},src:{js(record['src'])},alt:{js(record['alt'])},source:Object.freeze({{...YASSER_SCIENCE_UNIT2_VISUAL_SOURCE,page:{record['page']},bbox:Object.freeze([{box[0]},{box[1]},{box[2]},{box[3]}]),sha256:{js(record['sha256'])}}})}}),")
    lines.extend(['});',''])
    MANIFEST_PATH.write_text('\n'.join(lines),encoding='utf-8')


def make_contact_sheet(records):
    tiles=[]
    for record in records:
        image=Image.open(OUT_DIR/f"{record['id']}.webp").convert('RGB')
        image.thumbnail((440,320))
        tile=Image.new('RGB',(460,365),'white')
        tile.paste(image,((460-image.width)//2,32))
        ImageDraw.Draw(tile).text((8,8),f"{record['id']} | p{record['page']}",fill='black')
        tiles.append(tile)
    cols=3;rows=math.ceil(len(tiles)/cols)
    sheet=Image.new('RGB',(cols*460,rows*365),(230,230,230))
    for index,tile in enumerate(tiles):
        sheet.paste(tile,((index%cols)*460,(index//cols)*365))
    sheet.save(CONTACT_SHEET,'JPEG',quality=90)


def main():
    pdf=download_source();doc=pymupdf.open(stream=pdf,filetype='pdf')
    if doc.page_count<125:
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
        if crop.width<300 or crop.height<220:
            raise RuntimeError(f'{asset_id}: crop too small {crop.size}')
        path=OUT_DIR/f'{asset_id}.webp'
        crop.save(path,'WEBP',quality=94,method=6)
        sha=hashlib.sha256(path.read_bytes()).hexdigest()
        records.append({'id':asset_id,'src':f'assets/science/yasser/unit2/{asset_id}.webp','alt':spec['alt'],'page':page,'bbox':[box[0],box[1],box[2]-box[0],box[3]-box[1]],'sha256':sha,'width':crop.width,'height':crop.height})
        print(f'OK {asset_id}: page={page} size={crop.width}x{crop.height}')
    if len(records)!=len(CROPS):
        raise RuntimeError('Missing visual crops')
    unique=len({record['sha256'] for record in records})
    if unique!=len(records):
        raise RuntimeError(f'Expected {len(records)} unique visual crops, got {unique}')
    write_manifest(records);make_contact_sheet(records)
    (OUT_DIR/'manifest.json').write_text(json.dumps({'source':SOURCE_URL,'pdf_sha256':hashlib.sha256(pdf).hexdigest(),'page_count':doc.page_count,'assets':records,'unique':unique,'verification':'selected-assessment-figures'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Extracted {len(records)} Unit 2 assessment visuals.')


if __name__=='__main__':
    main()
