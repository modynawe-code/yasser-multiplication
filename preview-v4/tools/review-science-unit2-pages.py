#!/usr/bin/env python3
from pathlib import Path
import math
import requests
import pymupdf
from PIL import Image, ImageDraw

BOOK_URL='https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf'
OUT=Path('/tmp/science-unit2-review')
PAGE_RANGES=[range(76,105),range(106,133)]
SELECTED_PAGES=(83,84,87,88,97,98,99,104,112,114,117,123,125,131,132)
SCALE=1.0
DETAIL_SCALE=1.8
THUMB=(360,465)


def download():
    r=requests.get(BOOK_URL,timeout=90,headers={'User-Agent':'Mozilla/5.0 FamilyLearning/1.0'})
    r.raise_for_status()
    if not r.content.startswith(b'%PDF'):
        raise RuntimeError('Unexpected PDF response')
    return r.content


def render(doc,page_no,scale=SCALE):
    pix=doc[page_no-1].get_pixmap(matrix=pymupdf.Matrix(scale,scale),alpha=False)
    return Image.frombytes('RGB',[pix.width,pix.height],pix.samples)


def sheet(doc,pages,name):
    tiles=[]
    for p in pages:
        img=render(doc,p)
        img.thumbnail(THUMB)
        tile=Image.new('RGB',(THUMB[0]+20,THUMB[1]+42),'white')
        tile.paste(img,((tile.width-img.width)//2,32))
        ImageDraw.Draw(tile).text((10,8),f'PDF page {p}',fill='black')
        tiles.append(tile)
    cols=4; rows=math.ceil(len(tiles)/cols)
    canvas=Image.new('RGB',(cols*tiles[0].width,rows*tiles[0].height),(225,225,225))
    for i,t in enumerate(tiles):
        canvas.paste(t,((i%cols)*t.width,(i//cols)*t.height))
    canvas.save(OUT/name,'JPEG',quality=88,optimize=True)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    doc=pymupdf.open(stream=download(),filetype='pdf')
    if doc.page_count<132:
        raise RuntimeError(f'Unexpected page count: {doc.page_count}')
    sheet(doc,PAGE_RANGES[0],'chapter3-pages-76-104.jpg')
    sheet(doc,PAGE_RANGES[1],'chapter4-pages-106-132.jpg')
    for page_no in SELECTED_PAGES:
        render(doc,page_no,DETAIL_SCALE).save(OUT/f'page-{page_no}.jpg','JPEG',quality=92,optimize=True)
    print(f'Rendered Unit 2 review sheets and {len(SELECTED_PAGES)} detail pages.')

if __name__=='__main__':
    main()
