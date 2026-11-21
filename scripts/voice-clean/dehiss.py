# dehiss.py <in> <out.wav> <t0> <t1>: over [t0,t1] (source time) crossfade to a 4.5 kHz low-passed copy, 15 ms ramps; untouched elsewhere
import subprocess, sys, numpy as np, wave
src, dst, t0, t1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
def load(f, af=None):
    cmd = ["ffmpeg","-nostdin","-v","error","-i",f] + (["-af",af] if af else []) + ["-ac","1","-ar","44100","-f","s16le","-"]
    return np.frombuffer(subprocess.check_output(cmd), np.int16).astype(np.float32)
x = load(src); lp = load(src, "lowpass=f=4500:p=2,lowpass=f=4500:p=2")
n = min(len(x), len(lp)); x, lp = x[:n], lp[:n]
m = np.zeros(n); a, b, r = int(t0*44100), int(t1*44100), int(0.015*44100)
m[a:b] = 1; m[a-r:a] = np.linspace(0,1,r); m[b:b+r] = np.linspace(1,0,r)
y = x*(1-m) + lp*m
w = wave.open(dst,"wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(44100); w.writeframes(np.clip(y,-32768,32767).astype(np.int16).tobytes()); w.close()
d = (y-x); print("changed outside the span: %.1f dB" % (20*np.log10(np.sqrt((np.concatenate([d[:a-r],d[b+r:]])**2).mean())+1e-9)))
