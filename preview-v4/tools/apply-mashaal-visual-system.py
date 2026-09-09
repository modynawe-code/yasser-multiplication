from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import math
R=Path(__file__).resolve().parents[1]; A=R/'assets/mashaal'; O=A/'choices'; O.mkdir(parents=True,exist_ok=True)
W=H=720; PUR=(132,92,218); BLU=(104,184,236); GRN=(106,201,139); RED=(235,103,100); YEL=(255,208,86); ORG=(240,156,83); INK=(39,47,68)
feel=Image.open(A/'domains/feelings.webp').convert('RGBA'); health=Image.open(A/'domains/health.webp').convert('RGBA'); think=Image.open(A/'domains/thinking.webp').convert('RGBA')
core=feel.crop((330,0,720,650)); emo={'happy':(15,225,375,565),'sad':(650,255,1015,605),'angry':(5,540,390,970)}
def bg(c1=(250,246,255),c2=(241,248,255)):
 im=Image.new('RGB',(W,H)); p=im.load()
 for y in range(H):
  t=y/(H-1); c=tuple(round(c1[i]*(1-t)+c2[i]*t) for i in range(3))
  for x in range(W): p[x,y]=c
 im=im.convert('RGBA'); g=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(g); d.ellipse((-100,500,820,860),fill=(255,255,255,150)); im.alpha_composite(g.filter(ImageFilter.GaussianBlur(25))); return im
def panel(im):
 d=ImageDraw.Draw(im); d.rounded_rectangle((40,45,680,685),42,fill=(255,255,255,238),outline=(226,213,241),width=3)
def fit(im,src,box):
 x0,y0,x1,y1=box; s=src.copy(); b=s.getbbox(); s=s.crop(b) if b else s; k=min((x1-x0)/s.width,(y1-y0)/s.height); s=s.resize((int(s.width*k),int(s.height*k)),Image.Resampling.LANCZOS); im.alpha_composite(s,(x0+(x1-x0-s.width)//2,y0+(y1-y0-s.height)//2))
def save(im,n): im.convert('RGB').save(O/n,'WEBP',quality=86,method=6)
def child(im,box=(55,115,360,650)): fit(im,core,box)
def arrow(d,a,b,c=GRN,w=16):
 d.line((*a,*b),fill=c,width=w); ang=math.atan2(b[1]-a[1],b[0]-a[0]); L=28
 for q in (2.5,-2.5): d.line((*b,b[0]+L*math.cos(ang+q),b[1]+L*math.sin(ang+q)),fill=c,width=w)
def block(d,x,y,c,s=58): d.rounded_rectangle((x,y,x+s,y+s),12,fill=c,outline='white',width=5)
def ball(d,x,y,r=52): d.ellipse((x-r,y-r,x+r,y+r),fill=ORG,outline='white',width=6)
def hot(d,x=430,y=280):
 d.rounded_rectangle((x,y,x+190,y+125),24,fill=(82,91,112),outline='white',width=5)
 d.ellipse((x+28,y+28,x+92,y+92),fill=RED); d.ellipse((x+100,y+28,x+164,y+92),fill=ORG)
 for dx in (45,100,150): d.arc((x+dx-18,y-50,x+dx+18,y+5),180,350,fill=RED,width=7)
def box(d,x=430,y=380): d.rounded_rectangle((x,y,x+200,y+150),25,fill=(92,170,226),outline='white',width=6)
def card(n,prop=None,child_on=True,c1=(250,246,255),c2=(241,248,255)):
 im=bg(c1,c2); panel(im); child(im) if child_on else None; d=ImageDraw.Draw(im); prop(d,im) if prop else None; save(im,n)
for n,kind in [('wet-hands.webp','wet'),('soap.webp','soap'),('rub-hands.webp','rub'),('rinse-hands.webp','rinse')]:
 def p(d,im,k=kind):
  d.rounded_rectangle((400,260,620,295),18,fill=(132,151,171)); d.rounded_rectangle((555,275,595,410),18,fill=(132,151,171)); d.rounded_rectangle((350,430,650,535),34,fill=(220,235,244),outline=(145,166,182),width=6)
  if k in ('wet','rinse'):
   for x in (520,545,570): d.line((x,305,x,455),fill=BLU,width=10)
  if k=='soap': d.rounded_rectangle((470,330,555,445),20,fill=(245,165,197),outline='white',width=5)
  if k=='rub':
   for x,y,r in ((430,420,18),(475,390,14),(515,430,22),(560,400,14),(600,435,18)): d.ellipse((x-r,y-r,x+r,y+r),fill='white',outline=(153,216,244),width=3)
 card(n,p,True,(244,250,255),(251,244,255))
card('hot-surface.webp',lambda d,i:hot(d),True,(255,248,245),(250,240,255))
card('stay-away.webp',lambda d,i:(hot(d),d.rounded_rectangle((375,130,393,600),9,fill=GRN),arrow(d,(430,500),(315,500),GRN)),True,(248,255,249),(244,246,255))
card('touch-hot.webp',lambda d,i:(hot(d),d.rounded_rectangle((340,385,475,445),28,fill=(244,190,145)),arrow(d,(370,415),(455,415),RED)),True,(255,246,243),(252,241,250))
card('play-near-hot.webp',lambda d,i:(hot(d,455,270),ball(d,400,535,55)),True,(255,248,245),(247,243,255))
card('playtime-cleanup.webp',lambda d,i:(box(d),block(d,365,550,RED),block(d,445,565,YEL),block(d,525,535,GRN)))
card('help-tidy.webp',lambda d,i:(box(d),block(d,370,390,RED),arrow(d,(405,430),(475,445),GRN)))
card('leave-mess.webp',lambda d,i:(block(d,380,545,RED),block(d,465,565,YEL),block(d,550,530,GRN),arrow(d,(410,370),(590,370),ORG)))
card('scatter-toys.webp',lambda d,i:(box(d,470,385),block(d,370,550,RED),block(d,470,570,YEL),block(d,570,520,GRN),arrow(d,(510,390),(620,520),RED)))
for k,b in emo.items():
 im=bg(*{'happy':((255,252,229),(255,245,251)),'sad':((240,246,255),(247,243,255)),'angry':((255,244,242),(252,240,250))}[k]); panel(im); fit(im,feel.crop(b),(100,90,620,650)); save(im,k+'.webp')
im=bg((240,246,255),(247,243,255)); panel(im); fit(im,feel.crop(emo['sad']),(70,100,470,610)); d=ImageDraw.Draw(im); ball(d,575,520,48); save(im,'girl-lost-toy.webp')
card('rainy-day.webp',lambda d,i:([d.line((x,y,x-18,y+36),fill=BLU,width=9) for x,y in ((410,90),(500,120),(610,80),(560,180),(455,200))],d.pieslice((380,220,630,470),180,360,fill=PUR,outline='white',width=5)),True,(235,247,255),(244,241,255))
card('umbrella.webp',lambda d,i:(d.pieslice((210,230,510,530),180,360,fill=PUR,outline='white',width=6),d.line((360,380,360,610),fill=INK,width=10)),False)
card('sunglasses.webp',lambda d,i:(d.rounded_rectangle((190,300,330,430),24,fill=INK),d.rounded_rectangle((390,300,530,430),24,fill=INK),d.line((330,365,390,365),fill=INK,width=12)),False,(255,251,232),(244,249,255))
card('ball.webp',lambda d,i:ball(d,360,360,115),False)
ang=feel.crop(emo['angry'])
def angry(im): fit(im,ang,(60,120,350,620))
for n,mode in [('fallen-block-tower.webp','fall'),('throw-blocks.webp','throw'),('kick-blocks.webp','kick')]:
 im=bg((255,247,245),(249,243,255)); panel(im); angry(im); d=ImageDraw.Draw(im)
 if mode=='fall': block(d,405,500,RED,72); block(d,500,535,YEL,72); block(d,545,425,GRN,72); block(d,455,380,BLU,72)
 elif mode=='throw': block(d,500,240,RED,70); arrow(d,(385,410),(520,270),RED)
 else: block(d,540,520,RED,75); arrow(d,(370,535),(510,535),RED)
 save(im,n)
for n,rel in [('ball-above-box.webp','above'),('ball-inside-box.webp','inside'),('ball-below-box.webp','below')]:
 im=bg((242,249,255),(248,244,255)); panel(im); d=ImageDraw.Draw(im); box(d,260,330)
 if rel=='above': ball(d,360,190,62)
 elif rel=='inside': ball(d,360,400,60)
 else: ball(d,360,575,60)
 save(im,n)
card('wake.webp',lambda d,i:(d.rounded_rectangle((380,365,650,540),28,fill=(121,166,220),outline='white',width=6),d.ellipse((570,110,640,180),fill=YEL)),True)
card('brush-teeth.webp',lambda d,i:(d.line((390,430,620,380),fill=(245,245,245),width=25),d.line((555,395,625,380),fill=BLU,width=18)),True,(244,250,255),(251,245,255))
card('breakfast.webp',lambda d,i:(d.rounded_rectangle((380,450,650,480),12,fill=(166,116,77)),d.ellipse((430,400,560,455),fill='white',outline=(220,220,220),width=4),d.ellipse((470,415,520,450),fill=YEL)),True,(255,251,239),(248,245,255))
im=bg((255,246,244),(249,242,255)); panel(im); fit(im,ang,(70,100,430,630)); d=ImageDraw.Draw(im); arrow(d,(500,370),(420,370),RED); save(im,'walk-away-angry.webp')
for k in ('wait-turn','grab-ball','ask-help'):
 src=Image.open(O/f'{k}.webp').convert('RGBA'); im=bg(); panel(im); fit(im,src,(80,70,640,650)); save(im,k+'.webp')
im=bg((244,252,255),(248,243,255)); panel(im); fit(im,health,(70,80,630,650)); save(im,'balance.webp')
im=bg((248,252,255),(250,244,255)); panel(im); fit(im,think,(70,80,630,650)); save(im,'fine-motor.webp')
im=bg((241,251,255),(249,244,255)); panel(im); fit(im,health,(90,70,630,650)); save(im,'girl-drinking-water.webp')
ui=R/'src/modules/mashaal/ui'; wm=ui/'mashaal-web-media.js'
local_keys={'wet-hands':'أبلل يدي','soap':'أستخدم الصابون','rub-hands':'أفرك يدي','rinse-hands':'أشطف يدي','hot-surface':'سطح حار','stay-away':'أبتعد','touch-hot':'ألمس السطح الحار','play-near-hot':'ألعب قرب السطح الحار','playtime-cleanup':'انتهى وقت اللعب','help-tidy':'أساعد في الترتيب','leave-mess':'أترك المكان','scatter-toys':'أنثر الألعاب','girl-lost-toy':'طفلة فقدت لعبتها','happy':'فرحانة','sad':'حزينة','angry':'زعلانة','rainy-day':'يوم ممطر','umbrella':'مظلة','sunglasses':'نظارة شمسية','ball':'كرة','fallen-block-tower':'برج مكعبات وقع','throw-blocks':'أرمي المكعبات','kick-blocks':'أركل المكعبات','ball-above-box':'الكرة فوق الصندوق','ball-inside-box':'الكرة داخل الصندوق','ball-below-box':'الكرة تحت الصندوق','wake':'استيقاظ','brush-teeth':'تنظيف الأسنان','breakfast':'فطور','walk-away-angry':'أبتعد وأنا غاضبة','balance':'توازن','fine-motor':'مهارة أصابع دقيقة','girl-drinking-water':'طفلة تشرب الماء'}
t=wm.read_text(); start=t.index('const COLORS='); end=t.index('export function getMashaalWebMedia')
head=t[:start]; tail=t[end:]; existing="""const sourceIcon=(name,altAr)=>Object.freeze({url:`${TABLER_BASE}/${name}.svg`,altAr,source:'Tabler Icons 3.34.1',license:'MIT'});\n\nexport const MASHAAL_WEB_MEDIA=Object.freeze({\n  'saudi-flag':Object.freeze({url:`${FLAG_BASE}/sa.svg`,altAr:'علم المملكة العربية السعودية',source:'lipis/flag-icons 7.3.2',license:'MIT'}),\n  'japan-flag':Object.freeze({url:`${FLAG_BASE}/jp.svg`,altAr:'علم اليابان',source:'lipis/flag-icons 7.3.2',license:'MIT'}),\n  'brazil-flag':Object.freeze({url:`${FLAG_BASE}/br.svg`,altAr:'علم البرازيل',source:'lipis/flag-icons 7.3.2',license:'MIT'}),\n  doctor:local('doctor','طبيب'),teacher:local('teacher','معلمة'),baker:local('baker','خباز'),\n  'return-book':local('return-book','أرجع الكتاب'),'leave-book-floor':local('leave-book-floor','أترك الكتاب على الأرض'),'damage-book':local('damage-book','أتلف الكتاب'),\n  duck:local('duck-reference-unused','بطة'),apple:local('apple','تفاحة'),moon:local('moon','قمر'),\n  'compare-three-apples':local('compare-three-apples','ثلاث تفاحات'),'compare-four-apples':local('compare-four-apples','أربع تفاحات'),'compare-five-apples':local('compare-five-apples','خمس تفاحات'),\n  'healthy-apple':local('healthy-apple','تفاحة'),candy:local('candy','حلوى'),fries:local('fries','بطاطس مقلية'),\n  'two-children-one-ball':local('wait-turn','طفلتان ولعبة واحدة'),'wait-turn':local('wait-turn','أنتظر دوري'),'grab-ball':local('grab-ball','آخذ الكرة'),'ask-help':local('ask-help','أطلب المساعدة'),\n"""
for k,v in local_keys.items(): existing+=f"  '{k}':local('{k}','{v}'),\n"
existing+="  hospital:sourceIcon('building-hospital','مستشفى'),school:sourceIcon('school','مدرسة'),bakery:sourceIcon('bread','مخبز'),car:sourceIcon('car','سيارة'),airplane:sourceIcon('plane','طائرة'),boat:sourceIcon('sailboat','قارب')\n});\n\n"
wm.write_text(head+existing+tail)
v=ui/'mashaal-visuals.js'; s=v.read_text(); s=s.replace("host.appendChild(simpleVisual('balance',{compact}));return host;","const media=getMashaalWebMedia('balance'); host.appendChild(media?mediaVisual('balance',media,{compact}):simpleVisual('balance',{compact}));return host;").replace("host.appendChild(simpleVisual('fine-motor',{compact}));return host;","const media=getMashaalWebMedia('fine-motor'); host.appendChild(media?mediaVisual('fine-motor',media,{compact}):simpleVisual('fine-motor',{compact}));return host;"); v.write_text(s)
wc=ui/'mashaal-web-media.css'; s=wc.read_text().replace('object-fit:cover;object-position:center','object-fit:contain;object-position:center'); mark='/* unified activity media slot */'; s=s if mark in s else s+"\n"+mark+"\n#mashaalActivityView .mashaal-choice>.mashaal-choice-visual>.mashaal-media-visual{width:100%;height:100%;min-height:0}\n#mashaalActivityView .mashaal-choice>.mashaal-choice-visual>.mashaal-media-visual img{width:auto;height:100%;max-width:100%;max-height:100%;margin:auto;object-fit:contain!important}\n"; wc.write_text(s)
lc=ui/'mashaal-activity-layout.css'; s=lc.read_text(); mark='/* activity media containment */'; s=s if mark in s else s+"\n"+mark+"\n#mashaalActivityView .mashaal-choice>.mashaal-choice-visual>.mashaal-media-visual{width:100%;height:100%;min-height:0;border-radius:16px}\n"; lc.write_text(s)
sw=R/'service-worker.js'; s=sw.read_text().replace('shell-79','shell-81').replace('shell-80','shell-81')
if 'MASHAAL_CHOICE_ASSETS' not in s:
 names=sorted(p.name for p in O.glob('*.webp')); block='const MASHAAL_CHOICE_ASSETS=['+','.join(repr('./assets/mashaal/choices/'+n) for n in names)+'];\n'; pos=s.index('const APP_SHELL=['); s=s[:pos]+block+s[pos:]; s=s.replace('  ...MASHAAL_DOMAIN_ASSETS,\n','  ...MASHAAL_DOMAIN_ASSETS,\n  ...MASHAAL_CHOICE_ASSETS,\n',1)
sw.write_text(s)
p=R/'tests/mashaal-activity-layout.test.js'; p.write_text(p.read_text().replace('shell-79','shell-81').replace('shell-80','shell-81'))
p=R/'tests/mashaal-scenario-media.test.js'
p.write_text("""import test from 'node:test';
import assert from 'node:assert/strict';
import { getMashaalWebMedia } from '../src/modules/mashaal/ui/mashaal-web-media.js';
import { getMashaalKg3Activity } from '../src/modules/mashaal/curriculum/kg3-activity-catalog.js';
const KEYS=['doctor','teacher','baker','wait-turn','grab-ball','walk-away-angry','ask-help','return-book','leave-book-floor','damage-book','duck','apple','moon','compare-three-apples','compare-four-apples','compare-five-apples','healthy-apple','candy','fries','wet-hands','soap','rub-hands','rinse-hands','hot-surface','stay-away','touch-hot','play-near-hot','playtime-cleanup','help-tidy','leave-mess','scatter-toys','girl-lost-toy','happy','sad','angry','rainy-day','umbrella','sunglasses','ball','fallen-block-tower','throw-blocks','kick-blocks','ball-above-box','ball-inside-box','ball-below-box','wake','brush-teeth','breakfast','balance','fine-motor','girl-drinking-water'];
const ACTIVITIES=['kg3-handwashing-sequence-01','kg3-personal-safety-01','kg3-family-community-01','kg3-recognize-emotion-01','kg3-observe-reason-01','kg3-seek-help-01','kg3-spatial-position-01','kg3-story-sequence-01','kg3-turn-taking-01'];
const local=m=>Boolean(m)&&/^assets\\/mashaal\\/choices\\/[a-z0-9-]+\\.webp$/.test(m.url);
test('Mashaal child-facing scenario media is local WebP artwork',()=>{for(const key of KEYS){const m=getMashaalWebMedia(key);assert.ok(m,key);assert.ok(local(m),`${key} local WebP`);assert.doesNotMatch(m.url,/data:image|cdn\\.jsdelivr\\.net/);}});
test('completed KG3 activities cannot regress to icons or SVG fallbacks',()=>{for(const id of ACTIVITIES){const a=getMashaalKg3Activity(id);assert.ok(a,id);for(const key of a.choices||[])assert.ok(local(getMashaalWebMedia(key)),`${id}:${key}`);}});
test('national flags stay exact source-backed assets',()=>{for(const key of ['saudi-flag','japan-flag','brazil-flag'])assert.match(getMashaalWebMedia(key).url,/flag-icons@7\\.3\\.2/);});
""")
print('generated unified Mashaal WebP visual system')
