# Nominate Someone Overview video (Kai, approved 2026-11-09). Copied from render-city.py (the Welcome Guide section-video recipe, v3 look):
# Kai's scenes full bleed with a slow zoom; page captures in the phone frame over one city per subject; a new shot about every 3 s cut on her
# stt word timings; 0.4 s crossfades. Capture shots show sample answers, so each carries the SAMPLE stamp (CLAUDE.md, demos stamped Sample).
import sys, subprocess, importlib.util
from PIL import Image
spec=importlib.util.spec_from_file_location('c','v3compose.py'); c=importlib.util.module_from_spec(spec)
src=open('v3compose.py').read().split('\n# ---')[0]
exec(compile(open('v3compose.py').read().split('def on_stage')[0],'c','exec'),c.__dict__)
W,H,FPS,LEAD,XF=1080,1350,30,0.5,0.4
REPO='/home/user/vegansexplore-com/public/guides/nominate/'
S=[(0.0,'L:kai-flowers.jpg'),(3.7,'overview'),(5.3,'who'),(6.6,'G:entrepreneur.jpg'),(8.4,'G:nonprofit-guide.jpg'),(10.0,'G:partner-group-partner.jpg'),
   (12.6,'why'),(15.0,'L:kai-listen.jpg'),(17.2,'G:holiday/w-say.jpg'),(19.7,'G:holiday/p-listen.jpg'),(21.2,'G:partner-community-manager.jpg'),
   (22.7,'G:restaurant-guide/t-pulse.jpg'),(24.3,'send'),(26.4,'L:kai-ask.jpg'),(29.7,'sent'),(31.3,'L:kai-cheer.jpg')]
TOTAL=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','voice.mp3']))+LEAD+1.5
from PIL import ImageDraw
R='/home/user/vegansexplore-com/communities/'
CITIES=[R+x for x in ['south-florida/banner.jpg','new-york/hero-mobile.jpg','atlanta/banner.jpg','los-angeles/banner.jpg','philadelphia/banner.jpg',
  'london/hero-mobile.jpg','washington-dc/banner.jpg','central-florida/banner.jpg','virginia/banner.jpg','north-florida/banner.jpg','delaware/banner.jpg','west-virginia/banner.jpg']]
def big(path):
  im=Image.open(path).convert('RGB'); sc=max(2*W/im.width,2*H/im.height); return im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
def layer(name):
  # a clean RGBA layer, drawn at 2x and scaled down so every edge is smooth; no shadow
  if name.startswith('G:'):
    im=Image.open('/home/user/vegansexplore-com/public/guides/'+name[2:]).convert('RGB'); tw=1960; th=round(im.height*tw/im.width)
    if th>2300: th=2300; tw=round(im.width*th/im.height)
    im=im.resize((tw,th),Image.LANCZOS).convert('RGBA')
    m=Image.new('L',(tw,th),0); ImageDraw.Draw(m).rounded_rectangle([0,0,tw-1,th-1],radius=56,fill=255); im.putalpha(m)
  else:
    im=c.phone(f'cap/{name}.png',sw=1200)
  im=im.resize((im.width//2,im.height//2),Image.LANCZOS)
  L=Image.new('RGBA',(W,H),(0,0,0,0)); top=(H-im.height)//2 if im.height<H else 70; L.alpha_composite(im,((W-im.width)//2,top)); return L
GROUP=[None,'form','form','roles','roles','roles','why',None,'voice','voice','places','places','review',None,'done',None]
assert len(GROUP)==len(S),(len(GROUP),len(S))
k=0;imgs=[];gcity={}
for _,n in S:
  n=n.rstrip('?')
  if n.startswith('L:'): imgs.append(('zoom',big(REPO+n[2:]),None))
  else:
    g=GROUP[len(imgs)]
    if g not in gcity: gcity[g]=big(CITIES[k%len(CITIES)]); k+=1
    imgs.append(('layer',gcity[g],layer(n)))
def zoomed(im,t,a,b,yb=0.35):
  k2=min(max((t-a)/max(b-a,0.1),0),1); k2=k2*k2*(3-2*k2)*0.5+k2*0.5; z=1.0+0.07*k2
  bw,bh=im.size; cw,ch=2*W/z,2*H/z; x0=(bw-cw)/2; y0=(bh-ch)*yb
  return im.transform((W,H),Image.EXTENT,(x0,y0,x0+cw,y0+ch),Image.BICUBIC)
def frame(i,t):
  kind,im,L=imgs[i]
  a,b=starts[i],(starts[i+1] if i+1<len(S) else TOTAL)
  g=GROUP[i]
  if kind=='layer':  # the zoom runs over the whole subject, so the city keeps moving while the phones change
    ids=[j for j in range(len(S)) if GROUP[j]==g]; a=starts[ids[0]]; b=starts[ids[-1]+1] if ids[-1]+1<len(S) else TOTAL
  b=b+XF
  if kind=='zoom': return zoomed(im,t,a,b)
  bg=zoomed(im,t,a,b,0.5).convert('RGBA'); bg=Image.blend(bg,Image.new('RGBA',(W,H),(10,20,14,255)),0.15); bg.alpha_composite(L); bg=bg.convert('RGB')
  return c.stamp(bg) if not S[i][1].startswith('G:') else bg
starts=[s+LEAD if i else 0 for i,(s,_) in enumerate(S)]
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','video.mp4'],stdin=subprocess.PIPE)
n=round(TOTAL*FPS)
for f in range(n):
  t=f/FPS; i=max(j for j in range(len(S)) if starts[j]<=t)
  fr=frame(i,t)
  if i+1<len(S) and t>starts[i+1]-XF:
    a=(t-(starts[i+1]-XF))/XF; fr=Image.blend(fr,frame(i+1,t),min(max(a,0),1))
  p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait(); print('total',TOTAL)
