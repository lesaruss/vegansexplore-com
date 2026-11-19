# The trailer's 16:9 cut (Sean, 2026-11-19: "using shots that are 16 by 9, using screenshots that are from the desktop"). render-trailer.py's
# shots and timings, at 1920 x 1080: Liz's 16:9 scenes and the 16:9 end card full bleed with a slow zoom; desktop pages (cap-trailer-wide.js,
# 1600 x 900 at 2x) as a clean rounded card, drawn at 2x and scaled down, on a chapter's wide city art that slowly zooms (one city per subject).
# Run beside capw/, voice.mp3 (the v2 voice), liz-phone-16x9.jpg, liz-door-16x9.jpg, end-card-16x9.png.
import subprocess
from PIL import Image, ImageDraw
W,H,FPS,LEAD,XF=1920,1080,30,0.5,0.4
S=[(0.0,'L:liz-phone-16x9.jpg'),(2.9,'doors'),(6.6,'near'),(10.2,'events'),(12.0,'pulse'),(15.5,'guides'),(17.4,'guides2'),(19.4,'directory2'),
   (21.5,'directory'),(23.4,'founding2'),(25.7,'passport'),(27.8,'L:liz-door-16x9.jpg'),(30.0,'L:end-card-16x9.png')]
GROUP=[None,'doors','near','events','pulse','guides','guides','vouch','vouch','founding','founding',None,None]
TOTAL=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','voice.mp3']))+LEAD+1.5
R='/home/user/vegansexplore-com/communities/'
CITIES=[R+x+'/wide.jpg' for x in ['south-florida','seattle','new-york','atlanta','los-angeles','philadelphia','washington-dc','central-florida','north-florida']]
def big(path):
  im=Image.open(path).convert('RGB'); sc=max(2*W/im.width,2*H/im.height); return im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
def card(name):
  im=Image.open(f'capw/{name}.png').convert('RGB'); cw=2*1580; ch=round(im.height*cw/im.width); im=im.resize((cw,ch),Image.LANCZOS)
  bd=16; out=Image.new('RGBA',(cw+2*bd,ch+2*bd),(0,0,0,0)); m=Image.new('L',out.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,out.width-1,out.height-1],radius=48,fill=255)
  bg=Image.new('RGBA',out.size,(255,255,255,255)); bg.putalpha(m); out.alpha_composite(bg)
  m2=Image.new('L',(cw,ch),0); ImageDraw.Draw(m2).rounded_rectangle([0,0,cw-1,ch-1],radius=34,fill=255); im=im.convert('RGBA'); im.putalpha(m2); out.alpha_composite(im,(bd,bd))
  out=out.resize((out.width//2,out.height//2),Image.LANCZOS)
  L=Image.new('RGBA',(W,H),(0,0,0,0)); L.alpha_composite(out,((W-out.width)//2,(H-out.height)//2)); return L
k=0;imgs=[];gcity={}
for i,(_,n) in enumerate(S):
  if n.startswith('L:'): imgs.append(('zoom',big(n[2:]),None))
  else:
    g=GROUP[i]
    if g not in gcity: gcity[g]=big(CITIES[k%len(CITIES)]); k+=1
    imgs.append(('layer',gcity[g],card(n)))
def zoomed(im,t,a,b,yb=0.4):
  k2=min(max((t-a)/max(b-a,0.1),0),1); k2=k2*k2*(3-2*k2)*0.5+k2*0.5; z=1.0+0.06*k2
  bw,bh=im.size; cw,ch=2*W/z,2*H/z; x0=(bw-cw)/2; y0=(bh-ch)*yb
  return im.transform((W,H),Image.EXTENT,(x0,y0,x0+cw,y0+ch),Image.BICUBIC)
starts=[s+LEAD if i else 0 for i,(s,_) in enumerate(S)]
def frame(i,t):
  kind,im,L=imgs[i]; a,b=starts[i],(starts[i+1] if i+1<len(S) else TOTAL); g=GROUP[i]
  if kind=='layer':
    ids=[j for j in range(len(S)) if GROUP[j]==g]; a=starts[ids[0]]; b=starts[ids[-1]+1] if ids[-1]+1<len(S) else TOTAL
  b=b+XF
  if kind=='zoom': return zoomed(im,t,a,b)
  bg=zoomed(im,t,a,b,0.5).convert('RGBA'); bg=Image.blend(bg,Image.new('RGBA',(W,H),(10,20,14,255)),0.2); bg.alpha_composite(L); return bg.convert('RGB')
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','video-wide.mp4'],stdin=subprocess.PIPE)
for f in range(round(TOTAL*FPS)):
  t=f/FPS; i=max(j for j in range(len(S)) if starts[j]<=t); fr=frame(i,t)
  if i+1<len(S) and t>starts[i+1]-XF: a=(t-(starts[i+1]-XF))/XF; fr=Image.blend(fr,frame(i+1,t),min(max(a,0),1))
  p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait(); print('total',TOTAL)
