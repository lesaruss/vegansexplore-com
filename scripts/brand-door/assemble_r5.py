"""Builds For <Brand> tour clips, round 5 (Sean, 2026-10-09: "slide 3 ends with her mouth open... she should stop naturally").
Each Wan 2.7 lip-sync take (10 s) is cut where Maya's mouth is most closed, in the window just after her last word, instead of
at a fixed time after it. The mouth is found per take: the small window near the middle of her face that moves most while she
talks. Then: a 0.25 s lead-in (first frame held, audio delayed), a short fade in and out, 640px, poster = first frame.
Run it in Higgsfield's sandbox, where the takes download. Usage: assemble_r5.py <raw.mp4> <out.mp4> <poster.jpg> [cut_seconds]
Prints the cut time and how open the mouth is there (0 = as closed as the start picture). The measure is thrown off when her
head turns, so always look at the last second frame by frame; if the mouth is open at the end, pass the cut by hand
(slide 6 of the Oatly tour: 8.6)."""
import subprocess, sys, re
import numpy as np

raw, out, poster = sys.argv[1:4]
manual = float(sys.argv[4]) if len(sys.argv) > 4 else 0
W, FPS = 288, 25

def run(c): subprocess.run(c, shell=True, check=True)
def dur(f): return float(subprocess.check_output(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{f}"', shell=True))

def spoken_end(clip):
    """Where she stops talking: the start of the silence that runs to the end of the take."""
    o = subprocess.run(f'ffmpeg -hide_banner -i "{clip}" -af silencedetect=noise=-38dB:d=0.4 -f null -', shell=True, capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
    L = dur(clip)
    for s in reversed(st):
        later = [e for e in en if e > s]
        if (not later or later[0] >= L - 0.05) and s > 1.0: return s
    return L

frames = np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', raw, '-vf', f'fps={FPS},scale={W}:{W},format=gray', '-f', 'rawvideo', '-'],
                                      capture_output=True).stdout, np.uint8).reshape(-1, W, W).astype(np.float32)
n, end = len(frames), spoken_end(raw)
talk = frames[int(1.5 * FPS):int(end * FPS)]
# The mouth: the 12x8 window, near the middle of the face, that changes most while she talks.
best, at = -1.0, (0, 0)
for y in range(int(.30 * W), int(.44 * W) - 8, 2):
    for x in range(int(.38 * W), int(.58 * W) - 12, 2):
        v = talk[:, y:y + 8, x:x + 12].mean(axis=(1, 2)).std()
        if v > best: best, at = v, (y, x)
y, x = at
openness = np.abs(frames[:, y:y + 8, x:x + 12] - frames[0, y:y + 8, x:x + 12]).mean(axis=(1, 2))
lo, hi = int((end + 0.25) * FPS), min(n - 1, int((end + 1.3) * FPS))
k = lo + int(np.argmin(openness[lo:hi + 1])) if hi > lo else n - 1
cut = manual or (k + 1) / FPS
if manual: k = min(n - 1, int(manual * FPS) - 1)
run(f'ffmpeg -loglevel error -y -t {cut:.3f} -i "{raw}" '
    f'-vf "tpad=start_duration=0.25:start_mode=clone,scale=640:640,setsar=1,fps=30,format=yuv420p" '
    f'-af "adelay=250:all=1,afade=t=in:st=0.25:d=0.08,afade=t=out:st={max(0, cut + 0.25 - 0.2):.2f}:d=0.2" '
    f'-c:v libx264 -preset medium -crf 26 -c:a aac -b:a 112k -ar 44100 -ac 2 -movflags +faststart "{out}"')
run(f'ffmpeg -loglevel error -y -i "{out}" -frames:v 1 -vf scale=640:640 -q:v 4 "{poster}"')
print(f'{raw}: speech ends {end:.2f}s, cut {cut:.2f}s (mouth {openness[k]:.1f}, while talking {openness[int(1.5*FPS):int(end*FPS)].mean():.1f}), mouth at ({x/W:.2f},{y/W:.2f}), out {dur(out):.2f}s')
