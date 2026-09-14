#!/usr/bin/env python3
from pathlib import Path
import math
import requests
import pymupdf
from PIL import Image, ImageDraw

BOOK_URL='https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf'
PAGES=[22,26,27,*range(32,43),45,46,47]
OUT=Path('/tmp/science-textbook-pages.jpg')
PAGES_DIR=Path('/tmp/science-textbook-pages-full')
PAGES_DIR.mkdir(parents=True,exist_ok=True)

r=requests.get(BOOK_URL,timeout=90,headers={'User-Agent':'Mozilla/5.0 FamilyLearning/1.0'})
r.raise_for_status();doc=pymupdf.open(stream=r.content,filetype='pdf')
thumbs=[]
for p in PAGES:
    pix=doc[p-1].get_pixmap(matrix=pymupdf.Matrix(1.8,1.8),alpha=False)
    full=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
    full.save(PAGES_DIR/f'page-{p}.jpg','JPEG',quality=94)
    img=full.copy();img.thumbnail((420,560))
    tile=Image.new('RGB',(440,600),'white');tile.paste(img,((440-img.width)//2,28));ImageDraw.Draw(tile).text((8,8),f'PDF page {p}',fill='black');thumbs.append(tile)
cols=4;rows=math.ceil(len(thumbs)/cols);sheet=Image.new('RGB',(cols*440,rows*600),(225,225,225))
for i,t in enumerate(thumbs):sheet.paste(t,((i%cols)*440,(i//cols)*600))
sheet.save(OUT,'JPEG',quality=90)
print(OUT)
