# v3 frames: 1080x1350 (4:5), white stage, a real phone frame with headroom, no zoom. Scenes from the sample's full-size photos.
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
CW,CH=1080,1350
FB='/usr/share/fonts/opentype/inter/Inter-Bold.otf'; FS='/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
def font(p,s): return ImageFont.truetype(p,s)
def stamp(im):
  d=ImageDraw.Draw(im); f=font(FB,30); x,y=44,44; w=sum(d.textlength(c,font=f)+6 for c in 'SAMPLE')+34
  d.rounded_rectangle([x,y,x+w,y+56],radius=9,fill=(246,152,32)); xx=x+20
  for c in 'SAMPLE': d.text((xx,y+11),c,font=f,fill=(26,26,26)); xx+=d.textlength(c,font=f)+6
  return im
def phone(cap, sw=563, dark=None):
  sc=Image.open(cap).convert('RGB'); k=sw/390; sb=round(47*k)
  sh=round(sc.height*sw/sc.width); body=sc.resize((sw,sh),Image.LANCZOS)
  bg=body.getpixel((sw//2,4)); lum=sum(bg)/3
  scr=Image.new('RGB',(sw,sb+sh),bg); scr.paste(body,(0,sb)); d=ImageDraw.Draw(scr)
  ink=(20,20,20) if lum>140 else (255,255,255)
  d.text((round(32*k),round(15*k)),'9:41',font=font(FS,round(16*k)),fill=ink)
  iw,ih=round(120*k),round(34*k); d.rounded_rectangle([(sw-iw)//2,round(10*k),(sw+iw)//2,round(10*k)+ih],radius=ih//2,fill=(0,0,0))
  bx=sw-round(34*k); by=round(18*k)  # battery
  d.rounded_rectangle([bx-round(25*k),by,bx,by+round(12*k)],radius=round(3*k),outline=ink,width=2); d.rectangle([bx-round(22*k),by+3,bx-round(5*k),by+round(12*k)-3],fill=ink)
  for i in range(4): h=round((4+i*2.4)*k); x=bx-round((70-i*6)*k); d.rectangle([x,by+round(12*k)-h,x+round(3.5*k),by+round(12*k)],fill=ink)
  bz=round(12*k); r=round(55*k)
  ph=Image.new('RGBA',(sw+2*bz,scr.height+2*bz),(0,0,0,0)); pd=ImageDraw.Draw(ph)
  pd.rounded_rectangle([0,0,ph.width-1,ph.height-1],radius=r+bz,fill=(24,24,26))
  m=Image.new('L',scr.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,sw-1,scr.height-1],radius=r,fill=255)
  ph.paste(scr,(bz,bz),m); return ph
def on_stage(ph, top=118, x=None, im=None):
  im=im or Image.new('RGB',(CW,CH),'white'); x=(CW-ph.width)//2 if x is None else x
  sh=Image.new('RGBA',(ph.width+80,ph.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([40,52,ph.width+40,ph.height+40],radius=90,fill=(0,0,0,60))
  sh=sh.filter(ImageFilter.GaussianBlur(26)); im.paste(sh,(x-40,top-40),sh); im.paste(ph,(x,top),ph); return im
def cover(path,w=CW,h=CH,ax=0.5,ay=0.5):
  s=Image.open(path).convert('RGB'); k=max(w/s.width,h/s.height); s=s.resize((round(s.width*k),round(s.height*k)),Image.LANCZOS)
  x=round((s.width-w)*ax); y=round((s.height-h)*ay); return s.crop((x,y,x+w,y+h))
def grid4(paths,labels):
  im=Image.new('RGB',(CW,CH),'white'); d=ImageDraw.Draw(im); f=font(FB,34); g=24; w=(CW-3*g)//2; h=(CH-160-3*g)//2
  for i,(p,l) in enumerate(zip(paths,labels)):
    x=g+(i%2)*(w+g); y=150+(i//2)*(h+g); c=cover(p,w,h)
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle([0,0,w-1,h-1],radius=22,fill=255); im.paste(c,(x,y),m)
    tw=d.textlength(l,font=f); d.rounded_rectangle([x+18,y+h-74,x+18+tw+32,y+h-18],radius=10,fill=(255,255,255)); d.text((x+34,y+h-67),l,font=f,fill=(29,77,46))
  return stamp(im)
def three():
  im=Image.new('RGB',(CW,CH),'white'); d=ImageDraw.Draw(im); f=font(FB,30)
  for i,(c,l) in enumerate([('cap/hero.png','Their brand'),('cap/hero_island.png','Island bright'),('cap/hero_night.png','Night lounge')]):
    ph=phone(c,sw=316); x=20+i*(ph.width+10); on_stage(ph,top=150,x=x,im=im)
    tw=d.textlength(l,font=f); d.text((x+(ph.width-tw)/2,150+ph.height+30),l,font=f,fill=(29,77,46))
  return stamp(im)
# (chapter, from, to, kind, source, brief, words)
SHOTS=json.load(open('shots.json'))
for i,s in enumerate(SHOTS,1):
  ch,a,b,kind,src,brief,words=s
  if kind=='phone': im=stamp(on_stage(phone('cap/'+src+'.png')))
  elif src=='V': im=cover('src/v.jpg',ay=0.3)
  elif src=='grid4': im=grid4(['src/s-outside-day.png','src/s-outside-dusk.png','src/s-room-back.png','src/s-team.png'],['By day','At night','Inside','Your team'])
  elif src=='three': im=three()
  else: im=stamp(cover('src/'+src+'.png',ax=0.5,ay=0.4))
  im.save(f'out/v3-{i:02d}.jpg',quality=90)
print(len(SHOTS))
