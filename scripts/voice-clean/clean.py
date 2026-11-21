# clean2.py <line> <raw conv mp3> <out mp3>: cut on speech, not on silence. stt word timings give the first and last word; from there
# walk 10 ms frames outward and stop at the first quiet frame (< -48 dBFS), so a mouse click on Stop (or Record) after a gap is left out.
# Then 30 ms fade in, 150 ms fade out, 250 ms pad, -16.0 LUFS with a soft limiter at -1.5 dBTP, mono 44.1 kHz 128k.
import json, os, re, subprocess, sys, numpy as np
S = "/tmp/claude-0/-home-user/a8a57a49-2921-5724-9423-f9cb11eca9e5/scratchpad/expo-audio"
line, src, dst = sys.argv[1:4]
key = open(S+"/key.txt").read().strip()
w = json.loads(subprocess.check_output(["curl","-s","-X","POST","https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-once-expo-voices?step=stt","-H","x-run-key: "+key,"--data-binary","@"+src]))["words"]
raw = subprocess.check_output(["ffmpeg","-nostdin","-v","error","-i",src,"-ac","1","-ar","44100","-f","s16le","-"])
x = np.frombuffer(raw, np.int16).astype(np.float32)/32768; F = 441
db = lambda i: 20*np.log10(np.sqrt((x[i*F:(i+1)*F]**2).mean())+1e-9)
n = len(x)//F
a = int(w[0][1]*100); b = int(w[-1][2]*100)
for _ in range(30):              # back from the first word, up to 0.3 s
    if a <= 0 or db(a-1) < -48: break
    a -= 1
for _ in range(40):              # on from the last word, up to 0.4 s
    if b >= n-1 or db(b) < -48: break
    b += 1
s0, s1 = max(0, a-2)/100, min(n, b+2)/100
def meas(f):
    e = subprocess.run(["ffmpeg","-nostdin","-hide_banner","-i",f,"-af","ebur128=peak=true","-f","null","-"],capture_output=True,text=True).stderr
    s = e[e.rindex("Summary"):]
    return float(re.search(r"I:\s+(-?[\d.]+)",s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+)",s).group(1))
t = dst + ".w.wav"; d = s1 - s0
subprocess.run(["ffmpeg","-nostdin","-v","error","-y","-i",src,"-af",f"atrim={s0}:{s1},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={d-0.15:.3f}:d=0.15,adelay=250,apad=pad_dur=0.25","-ac","1","-ar","44100",t],check=True)
g = -16.0 - meas(t)[0]
for _ in range(4):
    subprocess.run(["ffmpeg","-nostdin","-v","error","-y","-i",t,"-af",f"volume={g:.2f}dB,alimiter=limit=0.84:attack=5:release=60:level=false","-ar","44100","-ac","1","-c:a","libmp3lame","-b:a","128k",dst],check=True)
    i2, tp = meas(dst)
    if abs(i2+16) <= 0.1: break
    g += -16 - i2
os.remove(t)
print(f"{line}: kept {s0:.2f}-{s1:.2f} of {n/100:.2f}s (last word ends {w[-1][2]:.2f}), I {i2:.1f}, TP {tp:.1f}")
