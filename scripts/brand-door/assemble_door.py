"""Builds the For <Brand> tour clips (round 2, Sean 2026-10-09: no b-roll, Maya alone on camera, under 10 seconds).
Each Wan 2.7 lip-sync take (10 s) is trimmed at the end of her speech, sized to 640, and gets a poster: its first frame.
Run it in Higgsfield's sandbox, where the takes download. Usage: assemble_door.py <dir with raw-1.mp4 .. raw-9.mp4>
Writes slide-<n>.mp4 and poster-<n>.jpg next to them; upload those, then ve-off-lookup `save` them to
vegan-media/media/brand-door/<brand>/ and set listings.details.brand_door.clips."""
import subprocess, sys, re, os
D = sys.argv[1]
def run(c): subprocess.run(c, shell=True, check=True)
def dur(f): return float(subprocess.check_output(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{f}"', shell=True))

def spoken_end(clip):
    """Where Maya stops talking: the start of the silence that runs to the end of the take."""
    out = subprocess.run(f'ffmpeg -hide_banner -i "{clip}" -af silencedetect=noise=-38dB:d=0.4 -f null -', shell=True, capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    L = dur(clip)
    for s in reversed(st):
        later = [e for e in en if e > s]
        if (not later or later[0] >= L - 0.05) and s > 1.0: return s
    return L

for n in range(1, 10):
    raw = f'{D}/raw-{n}.mp4'
    if not os.path.exists(raw): continue
    end = min(dur(raw), spoken_end(raw) + 0.45)
    out = f'{D}/slide-{n}.mp4'
    run(f'ffmpeg -loglevel error -y -i "{raw}" -t {end:.2f} -vf "scale=640:640,setsar=1,fps=30,format=yuv420p" '
        f'-af "afade=t=out:st={max(0, end - 0.2):.2f}:d=0.2" -c:v libx264 -preset medium -crf 26 -c:a aac -b:a 112k -ar 44100 -ac 2 -movflags +faststart "{out}"')
    run(f'ffmpeg -loglevel error -y -i "{out}" -frames:v 1 -vf scale=640:640 -q:v 4 "{D}/poster-{n}.jpg"')
    print(n, round(dur(out), 2), os.path.getsize(out) // 1024, 'KB')
