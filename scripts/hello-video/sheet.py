from PIL import Image, ImageDraw, ImageFont
from shots import SHOTS
import textwrap
tw,th,cap=216,270,70; cols=7; rows=(len(SHOTS)+cols-1)//cols
sheet=Image.new('RGB',(cols*(tw+12)+12,rows*(th+cap+12)+12),'white'); d=ImageDraw.Draw(sheet)
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12); fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',12)
except: f=fb=ImageFont.load_default()
for i,(a,b,w,src) in enumerate(SHOTS):
    im=Image.open(src).convert('RGB'); s=max(tw/im.width,th/im.height); im=im.resize((round(im.width*s),round(im.height*s)))
    x0=(im.width-tw)//2; y0=int((im.height-th)*0.2); im=im.crop((x0,y0,x0+tw,y0+th))
    x=12+(i%cols)*(tw+12); y=12+(i//cols)*(th+cap+12); sheet.paste(im,(x,y))
    d.text((x,y+th+4),f"{i+1:02d}  {a:.1f}-{b:.1f}s",fill='black',font=fb)
    for j,l in enumerate(textwrap.wrap(w,34)[:3]): d.text((x,y+th+20+j*15),l,fill='#333',font=f)
sheet.save('contact-sheet.png')
