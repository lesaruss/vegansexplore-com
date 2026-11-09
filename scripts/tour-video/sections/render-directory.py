# Welcome Guide section video, page 2 (Search and the Directory). Phone frames on white (the Green Leaf v3 look), Liz's scenes full bleed
# with a slow zoom, a new picture about every 3 s cut on her stt word timings, 0.4 s crossfades. Voice 0.5 s in, -15 LUFS, bed 19 dB under.
import sys, subprocess, importlib.util
from PIL import Image
spec=importlib.util.spec_from_file_location('c','v3compose.py'); c=importlib.util.module_from_spec(spec)
src=open('v3compose.py').read().split('\n# ---')[0]
exec(compile(open('v3compose.py').read().split('def on_stage')[0],'c','exec'),c.__dict__)
W,H,FPS,LEAD,XF=1080,1350,30,0.5,0.4
REPO='/home/user/vegansexplore-com/public/guides/welcome/'
S=[(0.0,'L:liz-directory.jpg'),(1.8,'dir_top'),(4.9,'dir_city'),(6.8,'food'),(9.7,'products'),(12.7,'services'),(14.7,'health'),
   (17.1,'media_dir'),(19.3,'media'),(21.5,'community'),(25.0,'people'),(27.3,'L:liz-better.jpg'),(29.4,'listing'),(32.3,'submit'),
   (35.4,'feedback'),(38.0,'vote'),(40.4,'dir_top'),(42.7,'survey'),(44.8,'dir_city'),(46.8,'L:liz-directory.jpg')]
TOTAL=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','voice.mp3']))+LEAD+1.5
def stage(name):
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
