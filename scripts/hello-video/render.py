import sys, subprocess
from PIL import Image
from shots import SHOTS
W,H,FPS=1080,1350,30
n=int(sys.argv[1]) if len(sys.argv)>1 else len(SHOTS)
shots=SHOTS[:n]; end=shots[-1][1]
def cover(path):
    im=Image.open(path).convert('RGB'); s=max(2*W/im.width,2*H/im.height)
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    x=(im.width-2*W)//2; y=int((im.height-2*H)*0.2)
    return im.crop((x,y,x+2*W,y+2*H))
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
  '-i','note.mp3','-i','bed.mp3','-t',f'{end:.2f}','-filter_complex',f'[2:a]volume=-19dB,afade=t=in:d=1.0,afade=t=out:st={end-1.5:.2f}:d=1.5[bed];[1:a]apad[v];[v][bed]amix=inputs=2:duration=shortest:normalize=0,afade=t=out:st={end-0.4:.2f}:d=0.4[a]','-map','0:v','-map','[a]','-c:v','libx264','-preset','slow','-crf','24','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','128k','-movflags','+faststart',sys.argv[2] if len(sys.argv)>2 else 'out.mp4'],stdin=subprocess.PIPE)
for k,(a,b,_,src) in enumerate(shots):
    big=cover(src); frames=round((b-a)*FPS) if k<len(shots)-1 else round(end*FPS)-round(a*FPS)
    still = '/cap-' in src or src.endswith('page-holiday.png')   # page screenshots hold still (Sean: no zoom on the screens)
    for f in range(frames):
        t=f/FPS                                                     # seconds into the shot
        z=1.0 if still else 1+0.015*t                               # every picture zooms in, one direction, 1.5% a second
        cw,ch=2*W/z,2*H/z; cx,cy=W,H
        box=(cx-cw/2,cy-ch/2,cx+cw/2,cy+ch/2)
        fr=big.transform((W,H),Image.EXTENT,box,Image.BICUBIC)
        ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait()
