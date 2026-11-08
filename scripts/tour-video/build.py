import sys, json, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
W,H,FPS=720,900,30
DUR=[15.46,11.70,9.87,11.96,10.40,9.33,12.49,8.96,7.11,22.15,6.35]
O=[0.5]
for d in DUR[:-1]: O.append(O[-1]+d+0.45)
def T(line,t): return O[line-1]+t-0.15
S=[(0,'V'),(1.85,'hero_top'),(3.65,'samplebar'),(6.35,'hero_head'),(9.69,'space_out'),(11.41,'tour_talk'),(13.85,'menu_top'),
(16.26,'today'),(19.2,'hero_top'),(20.75,'hero_btns'),(22.62,'fav_head'),(24.44,'m_vote'),(26.0,'fav_card3'),
(28.41,'story'),(31.73,'story_video'),(33.89,'space_out'),(35.57,'space_night'),(36.29,'space_inside'),(37.21,'space_team'),
(38.73,'dish_top'),(40.95,'dish_allerg'),(42.6,'dish_nutr'),(44.29,'dish_ing'),(46.75,'dish_ing2'),(48.67,'o_search'),
(51.14,'signin'),(53.18,'signin_box'),(56.14,'m_vote'),(58.98,'m_dish_saved'),
(61.99,'o_samplebar'),(63.2,'o_bar'),(66.11,'o_ing'),(67.53,'o_search'),(69.53,'dish_name'),
(71.77,'order_top'),(73.43,'order_step'),(74.47,'order_cart'),(76.71,'samplebar'),(78.77,'space_team'),(81.31,'order_dlv'),
(84.71,'look_switch'),(87.25,'look_island'),(89.21,'look_night'),(91.01,'look_island_fav'),(92.6,'look_night_fav'),
(94.12,'footer_ve'),(97.16,'ve_listing'),(99.4,'ve_listing2'),
(101.68,'c_top'),(104.3,'c_rw2'),(106.78,'c_rw1'),(109.66,'c_pts'),(112.72,'c_code'),(114.54,'c_rw2'),(116.86,'c_club'),(119.98,'c_club2'),(122.3,'ve_listing'),
(124.28,'hero_top'),(126.76,'tour_talk'),(129.0,'V')]
END=O[-1]+DUR[-1]+1.2
starts=[s for s,_ in S]+[END]
for i,(s,n) in enumerate(S): 
  d=starts[i+1]-s
  if d>3.6: print('LONG',n,round(d,2))
print('shots',len(S),'end',round(END,2))
if len(sys.argv)>1 and sys.argv[1]=='plan': sys.exit()
A,B=(float(sys.argv[1]),float(sys.argv[2])) if len(sys.argv)>2 else (0,END)
out=sys.argv[3] if len(sys.argv)>3 else 'video.mp4'
# stamp
f=ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf',22) if True else None
import glob
fb=[x for x in glob.glob('/usr/share/fonts/opentype/inter/Inter-*.otf') if x.endswith('Inter-ExtraBold.otf') or x.endswith('Inter-Bold.otf')]
f=ImageFont.truetype(sorted(fb)[0],21)
st=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(st)
tw=d.textlength('SAMPLE',font=f)+4*5
x0,y0=16,H-82-16-38
d.rounded_rectangle([x0,y0,x0+tw+28,y0+38],radius=6,fill=(246,152,32,255))
d.text((x0+14,y0+7),'SAMPLE',font=f,fill=(26,26,26,255),spacing=0)
# letter-spaced redraw
d.rounded_rectangle([x0,y0,x0+tw+28,y0+38],radius=6,fill=(246,152,32,255));xx=x0+14
for ch in 'SAMPLE': d.text((xx,y0+7),ch,font=f,fill=(26,26,26,255)); xx+=d.textlength(ch,font=f)+4
SS=2;OW,OH=W*SS,H*SS
cache={}
def src(n):
  if n not in cache:
    im=Image.open(f'cap/{n}.png' if n!='V' else 'cap/V.jpg').convert('RGB')
    # fit to 4:5 cover at OW x OH * 1.12 headroom
    sc=max(OW/im.width,OH/im.height)
    im=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
    cache[n]=im
  return cache[n]
def shot(i,t):
  s,n=S[i];e=starts[i+1];u=min(max((t-(s-0.15))/(e-s+0.3),0),1)
  im=src(n)
  z0,z1=(1.0,1.07) if i%2==0 else (1.07,1.0)
  z=z0+(z1-z0)*u
  pan=[(0,-1),(0,1),(-1,0),(1,0)][i%4]
  cw,ch=OW/z,OH/z
  cx=im.width/2+pan[0]*(im.width-cw)/2*(u*2-1)*0.6
  cy=im.height/2+pan[1]*(im.height-ch)/2*(u*2-1)*0.6
  x,y=cx-cw/2,cy-ch/2
  fr=im.transform((OW,OH),Image.AFFINE,(cw/OW,0,x,0,ch/OH,y),resample=Image.BICUBIC)
  fr=fr.resize((W,H),Image.LANCZOS)
  if n not in ('V','tour_talk'): fr.paste(st,(0,0),st)
  return np.asarray(fr,dtype=np.float32)
XF=0.25
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','frames.mp4' if out=='video.mp4' else 'frames_'+out],stdin=subprocess.PIPE)
fi=0
for k in range(int(A*FPS),int(B*FPS)):
  t=k/FPS
  i=max(j for j in range(len(S)) if starts[j]<=t+1e-9)
  a=shot(i,t)
  if i+1<len(S) and t>starts[i+1]-XF/2:
    w=(t-(starts[i+1]-XF/2))/XF; a=a*(1-w)+shot(i+1,t)*w
  elif i>0 and t<starts[i]+XF/2:
    w=(t-(starts[i]-XF/2))/XF; a=shot(i-1,t)*(1-w)+a*w
  p.stdin.write(np.clip(a,0,255).astype(np.uint8).tobytes())
p.stdin.close();p.wait();print('frames done')
