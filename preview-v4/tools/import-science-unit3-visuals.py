#!/usr/bin/env python3
import hashlib,json,math
from pathlib import Path
import pymupdf,requests
from PIL import Image,ImageDraw

SOURCE_URL='https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf'
OUT_DIR=Path('preview-v4/assets/science/yasser/unit3')
MANIFEST_PATH=Path('preview-v4/src/modules/yasser/science/science-unit3-visuals.generated.js')
CONTACT_SHEET=Path('/tmp/science-unit3-crop-review.jpg')
RENDER_SCALE=1.8
REFERENCE_SIZE=(1944,2506)

CROPS={
'u3-food-web-land':{'page':141,'box':(470,1420,1880,2320),'alt':'شبكة غذائية على اليابسة توضح اتجاه انتقال الغذاء بين عدة مخلوقات'},
'u3-energy-pyramids':{'page':143,'box':(220,1390,1840,2310),'alt':'هرما طاقة على اليابسة وفي المحيط يوضحان المستويات الغذائية'},
'u3-biome-map':{'page':150,'box':(120,150,1735,1280),'alt':'خريطة المناطق الحيوية على سطح الأرض مع مفتاح الألوان'},
'u3-tundra-taiga':{'page':152,'box':(35,1660,1900,2460),'alt':'صورتان تقارنان منطقتي التايجا والتندرا'},
'u3-review-desert':{'page':162,'box':(1010,1840,1615,2225),'alt':'صورة منطقة جافة قليلة النباتات تستخدم لتحديد المنطقة الحيوية'},
'u3-model-food-web':{'page':163,'box':(1010,660,1870,1420),'alt':'شبكة غذائية في نموذج اختبار تضم أفعى ونسرًا وأسدًا وغزالًا وفأرًا ومنتجات'},
'u3-model-rainforest':{'page':163,'box':(300,1320,865,1970),'alt':'صورة غابة كثيفة الأشجار تستخدم لتحديد المنطقة الحيوية'},
'u3-soil-regions':{'page':169,'box':(55,1870,1900,2490),'alt':'صور تربة في بيئات مختلفة توضح اختلاف التربة باختلاف الموقع'},
'u3-roots-hold-soil':{'page':171,'box':(245,170,785,1515),'alt':'جذور شجرة تثبت التربة في مكانها'},
'u3-wind-energy':{'page':188,'box':(1120,1760,1605,2205),'alt':'توربينات رياح تستخدم لإنتاج الكهرباء'}
}

def download_source():
 r=requests.get(SOURCE_URL,timeout=90,headers={'User-Agent':'Mozilla/5.0 FamilyLearning/1.0'});r.raise_for_status();data=r.content
 if len(data)<1_000_000 or not data.startswith(b'%PDF'):raise RuntimeError('Unexpected PDF response')
 return data

def render_page(doc,p):
 pix=doc[p-1].get_pixmap(matrix=pymupdf.Matrix(RENDER_SCALE,RENDER_SCALE),alpha=False)
 return Image.frombytes('RGB',[pix.width,pix.height],pix.samples)

def scale_box(box,size):
 rw,rh=REFERENCE_SIZE;w,h=size;sx=w/rw;sy=h/rh;x1,y1,x2,y2=box
 return round(x1*sx),round(y1*sy),round(x2*sx),round(y2*sy)
def js(v):return json.dumps(v,ensure_ascii=False)

def write_manifest(records):
 lines=['// Generated asset manifest. Do not hand-edit.',f"export const YASSER_SCIENCE_UNIT3_VISUAL_SOURCE=Object.freeze({{label:'علوم سادس - الوحدة الثالثة',kind:'verified-curriculum-visual',authority:'textbook',url:{js(SOURCE_URL)}}});",'export const YASSER_SCIENCE_UNIT3_VISUAL_ASSETS=Object.freeze({']
 for r in records:
  b=r['bbox'];lines.append(f"  {js(r['id'])}:Object.freeze({{id:{js(r['id'])},src:{js(r['src'])},alt:{js(r['alt'])},source:Object.freeze({{...YASSER_SCIENCE_UNIT3_VISUAL_SOURCE,page:{r['page']},bbox:Object.freeze([{b[0]},{b[1]},{b[2]},{b[3]}]),sha256:{js(r['sha256'])}}})}}),")
 lines+=['});',''];MANIFEST_PATH.write_text('\n'.join(lines),encoding='utf-8')

def make_sheet(records):
 tiles=[]
 for r in records:
  im=Image.open(OUT_DIR/f"{r['id']}.webp").convert('RGB');im.thumbnail((440,320));tile=Image.new('RGB',(460,365),'white');tile.paste(im,((460-im.width)//2,32));ImageDraw.Draw(tile).text((8,8),f"{r['id']} | p{r['page']}",fill='black');tiles.append(tile)
 cols=3;rows=math.ceil(len(tiles)/cols);sheet=Image.new('RGB',(cols*460,rows*365),(230,230,230))
 for i,t in enumerate(tiles):sheet.paste(t,((i%cols)*460,(i//cols)*365))
 sheet.save(CONTACT_SHEET,'JPEG',quality=90)

def main():
 pdf=download_source();doc=pymupdf.open(stream=pdf,filetype='pdf');OUT_DIR.mkdir(parents=True,exist_ok=True);MANIFEST_PATH.parent.mkdir(parents=True,exist_ok=True);cache={};records=[]
 for asset_id,spec in CROPS.items():
  p=spec['page'];cache[p]=cache.get(p) or render_page(doc,p);im=cache[p];box=scale_box(spec['box'],im.size);crop=im.crop(box)
  if crop.width<300 or crop.height<220:raise RuntimeError(f'{asset_id}: crop too small {crop.size}')
  path=OUT_DIR/f'{asset_id}.webp';crop.save(path,'WEBP',quality=94,method=6);sha=hashlib.sha256(path.read_bytes()).hexdigest();records.append({'id':asset_id,'src':f'assets/science/yasser/unit3/{asset_id}.webp','alt':spec['alt'],'page':p,'bbox':[box[0],box[1],box[2]-box[0],box[3]-box[1]],'sha256':sha})
  print(f'OK {asset_id}: page={p} size={crop.width}x{crop.height}')
 if len({r['sha256'] for r in records})!=len(records):raise RuntimeError('Duplicate crop detected')
 write_manifest(records);make_sheet(records);(OUT_DIR/'manifest.json').write_text(json.dumps({'source':SOURCE_URL,'pdf_sha256':hashlib.sha256(pdf).hexdigest(),'page_count':doc.page_count,'assets':records,'verification':'selected-assessment-figures'},ensure_ascii=False,indent=2),encoding='utf-8');print(f'Extracted {len(records)} Unit 3 assessment visuals.')
if __name__=='__main__':main()
