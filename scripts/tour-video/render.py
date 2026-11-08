# Tour video renderer (ve-explorer-path, 2026-11-08). shots.txt: chapter|ord|from|to|image_url, the approved ve_video_shots rows.
# Each frame is held from its from to the next frame (the last to the end of its chapter), a slight eased zoom 1.00 to 1.07 drawn
# at 2x with sub-pixel sampling (no stair-stepping), piped raw to ffmpeg. DUR = each chapter mp3 length by ffprobe.
# Audio: pad each chapter to its ffprobe length before concatenating (mp3 decoders drop ~40 ms a file, which drifts the cuts),
# loudnorm the voice to -15 LUFS, loop the bed and set it 19 dB under, fade it over the 1.5 s tail. Encode crf 24 for the web.
import subprocess, sys
from PIL import Image
W,H,FPS=1080,1350,30
DUR={1:19.983673,2:15.830204,3:17.449796,4:28.029388,5:9.978776,6:30.171429,7:10.266122,8:34.690612}
TAIL=1.5
rows=[l.strip().split('|') for l in open('shots.txt') if l.strip()]
shots=[]
off=0.0
chap_off={}
for c in range(1,9):
    chap_off[c]=off; off+=DUR[c]
total=off+TAIL
for i,r in enumerate(rows):
    c,o,a,b=int(r[0]),int(r[1]),float(r[2]),float(r[3])
    start=chap_off[c]+a
    shots.append([c,o,start,r[3]])
for i,s in enumerate(shots):
    s.append(shots[i+1][2] if i+1<len(shots) else total)
# cues for vtt
cues=[(chap_off[int(r[0])]+float(r[2]), chap_off[int(r[0])]+float(r[3])) for r in rows]
open('cues.txt','w').write('\n'.join(f'{a:.3f} {b:.3f}' for a,b in cues))
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
  '-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','video.mp4'],stdin=subprocess.PIPE)
n_total=round(total*FPS); frame=0
for c,o,st,_,en in shots:
    im=Image.open(f'img/{c}-{o:02d}.jpg').convert('RGB')
    # cover-fit to 2x working size for smooth sampling
    sw,sh=im.size; sc=max(2*W/sw,2*H/sh)
    im=im.resize((round(sw*sc),round(sh*sc)),Image.LANCZOS)
    bw,bh=im.size
    end_f=round(en*FPS); n=end_f-frame
    for k in range(n):
        t=k/max(n-1,1); t=t*t*(3-2*t)*0.5+t*0.5  # gentle ease
        z=1.0+0.07*t
        cw,ch=2*W/z,2*H/z
        x0=(bw-cw)/2; y0=(bh-ch)/2
        fr=im.transform((W,H),Image.EXTENT,(x0,y0,x0+cw,y0+ch),Image.BICUBIC)
        p.stdin.write(fr.tobytes()); frame+=1
p.stdin.close(); p.wait()
print('frames',frame,'total',total)
