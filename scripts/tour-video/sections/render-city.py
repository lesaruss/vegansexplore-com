# Welcome Guide section video, page 2 (Search and the Directory). Phone frames on white (the Green Leaf v3 look), Liz's scenes full bleed
# with a slow zoom, a new picture about every 3 s cut on her stt word timings, 0.4 s crossfades. Voice 0.5 s in, -15 LUFS, bed 19 dB under.
import sys, subprocess, importlib.util
from PIL import Image
spec=importlib.util.spec_from_file_location('c','v3compose.py'); c=importlib.util.module_from_spec(spec)
src=open('v3compose.py').read().split('\n# ---')[0]
exec(compile(open('v3compose.py').read().split('def on_stage')[0],'c','exec'),c.__dict__)
W,H,FPS,LEAD,XF=1080,1350,30,0.5,0.4
REPO='/home/user/vegansexplore-com/public/guides/welcome/'
S=[(0.0,'L:liz-city.jpg'),(1.8,'hub'),(4.2,'pulse_top'),(6.0,'pulse'),(8.0,'jobs'),(10.0,'boards'),(12.8,'hub_events'),(15.0,'most_voted'),
   (17.4,'L:liz-better.jpg'),(20.0,'hub'),(22.3,'pulse'),(23.5,'jobs'),(24.9,'suggest'),(26.3,'feedback'),(28.8,'share'),(30.5,'communities'),
   (32.5,'next'),(34.9,'survey'),(37.0,'L:liz-founder.jpg'),(40.5,'pulse2'),(43.5,'G:partner-community-manager.jpg'),(45.7,'G:partner-group-partner.jpg'),
   (47.3,'G:welcome-guide.jpg'),(49.5,'G:prevegan.jpg'),(51.5,'hub_events'),(53.7,'L:liz-points.jpg?'),(56.0,'G:thumb-bounties.jpg'),
   (58.2,'G:welcome-ensemble.jpg'),(60.6,'G:thumb-community.jpg'),(63.0,'communities'),(64.2,'L:liz-city.jpg')]
TOTAL=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','voice.mp3']))+LEAD+1.5
def stage(name):
  name=name.rstrip('?')
  if name.startswith('G:'):
    im=Image.open('/home/user/vegansexplore-com/public/guides/'+name[2:]).convert('RGB'); tw=980; th=round(im.height*tw/im.width)
    if th>1150: th=1150; tw=round(im.width*th/im.height)
    im=im.resize((tw,th),Image.LANCZOS); from PIL import ImageDraw
    m=Image.new('L',(tw,th),0); ImageDraw.Draw(m).rounded_rectangle([0,0,tw-1,th-1],radius=28,fill=255)
    st=Image.new('RGB',(W,H),'white'); st.paste(im,((W-tw)//2,(H-th)//2),m); return ('still',st)
  if name.startswith('L:'):
    im=Image.open(REPO+name[2:]).convert('RGB'); sc=max(W/im.width,H/im.height)*1.06
    return ('zoom',im.resize((round(im.width*sc*2/1.06),round(im.height*sc*2/1.06)),Image.LANCZOS))
  ph=c.phone(f'cap/{name}.png',sw=600)
  im=Image.new('RGB',(W,H),'white'); top=(H-ph.height)//2 if ph.height<H else 70
  sh=Image.new('RGBA',ph.size,(0,0,0,0)); im.paste(ph,((W-ph.width)//2,top),ph)
  return ('still',im)
imgs=[stage(n) for _,n in S]
def frame(i,t):
  kind,im=imgs[i]
  if kind=='still': return im
  a,b=S[i][0]+LEAD,(S[i+1][0]+LEAD if i+1<len(S) else TOTAL)
  k=min(max((t-a)/max(b-a,0.1),0),1); z=1.0+0.06*k
  bw,bh=im.size; cw,ch=2*W/z,2*H/z; x0=(bw-cw)/2; y0=(bh-ch)*0.35
  return im.transform((W,H),Image.EXTENT,(x0,y0,x0+cw,y0+ch),Image.BICUBIC)
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','video.mp4'],stdin=subprocess.PIPE)
starts=[s+LEAD if i else 0 for i,(s,_) in enumerate(S)]
n=round(TOTAL*FPS)
for f in range(n):
  t=f/FPS; i=max(j for j in range(len(S)) if starts[j]<=t)
  fr=frame(i,t)
  if i+1<len(S) and t>starts[i+1]-XF:
    a=(t-(starts[i+1]-XF))/XF; fr=Image.blend(fr,frame(i+1,t),min(max(a,0),1))
  p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait(); print('total',TOTAL)
