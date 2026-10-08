"""Builds the For <Brand> tour videos: per slide, Maya on camera (a lip-synced take, generic, reused for every
brand) then a voice-over over b-roll (slow pans and zooms of real pages and our art). Usage: assemble_door.py <door dir> <repo> <brand>"""
import subprocess, sys, re, os
D, REPO, BRAND = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = f'{D}/out/{BRAND}'; os.makedirs(OUT, exist_ok=True); os.makedirs(f'{D}/tmp', exist_ok=True)
FPS = 30; S = 720
def run(c): subprocess.run(c, shell=True, check=True)
def dur(f): return float(subprocess.check_output(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{f}"', shell=True))
ENC = '-c:v libx264 -preset medium -crf 25 -pix_fmt yuv420p -r 30'

def spoken_end(clip):
    """Where Maya stops talking in a take: the start of the last long silence."""
    out = subprocess.run(f'ffmpeg -hide_banner -i "{clip}" -af silencedetect=noise=-38dB:d=0.4 -f null -', shell=True, capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    L = dur(clip)
    # a silence that runs to the end of the clip
    for s in reversed(st):
        later_end = [e for e in en if e > s]
        if not later_end or later_end[0] >= L - 0.05:
            if s > 1.0: return s
    return L

def maya(clip, name):
    end = min(dur(clip), spoken_end(clip) + 0.35)
    o = f'{D}/tmp/{name}.mp4'
    run(f'ffmpeg -loglevel error -y -i "{clip}" -t {end:.3f} -vf "scale={S}:{S},setsar=1,fps={FPS},format=yuv420p" -af "afade=t=out:st={max(0, end-0.15):.3f}:d=0.15" {ENC} -c:a aac -b:a 128k -ar 48000 -ac 2 "{o}"')
    return o

def still(img, secs, name, mode='zoom', crop=None):
    """One still as video: zoom (slow push in) or pan (top to bottom, for tall page shots)."""
    o = f'{D}/tmp/{name}.mp4'; n = int(round(secs * FPS))
    pre = f'crop={crop},' if crop else ''
    if mode == 'pan':
        vf = f"{pre}scale={S}:-2,crop={S}:{S}:0:'(ih-{S})*n/{max(1, n-1)}',setsar=1,format=yuv420p"
        run(f'ffmpeg -loglevel error -y -loop 1 -framerate {FPS} -i "{img}" -frames:v {n} -vf "{vf}" {ENC} -an "{o}"')
    else:
        vf = (f"{pre}scale=2*{S}:2*{S}:force_original_aspect_ratio=increase,crop=2*{S}:2*{S},"
              f"zoompan=z='1+0.10*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={S}x{S}:fps={FPS},setsar=1,format=yuv420p")
        run(f'ffmpeg -loglevel error -y -loop 1 -framerate {FPS} -i "{img}" -frames:v {n} -vf "{vf}" {ENC} -an "{o}"')
    return o

def broll(parts, audio, name):
    """parts: [(image, share, mode, crop)] laid end to end over the voice-over."""
    A = dur(audio) + 0.35; tot = sum(p[1] for p in parts); clips = []
    for k, (img, share, mode, crop) in enumerate(parts):
        clips.append(still(img, A * share / tot, f'{name}-{k}', mode, crop))
    lst = f'{D}/tmp/{name}.txt'; open(lst, 'w').write(''.join(f"file '{c}'\n" for c in clips))
    o = f'{D}/tmp/{name}.mp4'.replace('.mp4', '-vo.mp4')
    run(f'ffmpeg -loglevel error -y -f concat -safe 0 -i "{lst}" -i "{audio}" -map 0:v -map 1:a -af "apad,afade=t=out:st={A-0.2:.3f}:d=0.2" -t {A:.3f} {ENC} -c:a aac -b:a 128k -ar 48000 -ac 2 "{o}"')
    return o

def slide(n, take, vo_parts, vo_audio):
    a = maya(take, f'm{n}'); b = broll(vo_parts, vo_audio, f'b{n}')
    lst = f'{D}/tmp/s{n}.txt'; open(lst, 'w').write(f"file '{a}'\nfile '{b}'\n")
    o = f'{OUT}/slide-{n}.mp4'
    run(f'ffmpeg -loglevel error -y -f concat -safe 0 -i "{lst}" {ENC} -c:a aac -b:a 128k -movflags +faststart "{o}"')
    print(n, round(dur(o), 2), os.path.getsize(o) // 1024, 'KB')

ST, AU, TK = f'{D}/stills', f'{D}/audio', f'{D}/takes'
G = f'{REPO}/public/guides'
CITY = lambda s: [p for p in [f'{REPO}/communities/{s}/banner.jpg', f'{REPO}/communities/{s}/banner.png'] if os.path.exists(p)][0]
slide(1, f'{TK}/m-1.mp4', [(f'{ST}/{BRAND}-overview.png', 1, 'pan', None)], f'{AU}/{BRAND}-vo-1.mp3')
slide(2, f'{TK}/m-2.mp4', [(f'{ST}/dairy-guide.png', 1, 'zoom', None), (f'{ST}/aisle.png', 1, 'zoom', None), (f'{ST}/{BRAND}-milk.png', 1.05, 'pan', None)], f'{AU}/vo-2.mp3')
slide(3, f'{TK}/m-3.mp4', [(f'{D}/sample-ad.png', 1, 'zoom', None)], f'{AU}/vo-3.mp3')
slide(4, f'{TK}/m-4.mp4', [(CITY(c), 1, 'zoom', None) for c in ['south-florida', 'atlanta', 'new-york', 'los-angeles']], f'{AU}/vo-4.mp3')
slide(5, f'{TK}/m-5.mp4', [(f'{REPO}/public/events/vegan-foodie-fest-2025.jpg', 1.3, 'zoom', None), (f'{G}/thumb-passport.jpg', 1, 'zoom', None)], f'{AU}/vo-5.mp3')
slide(6, f'{TK}/m-6.mp4', [(f'{ST}/campaign.png', 1, 'zoom', '1000:620:0:0')], f'{AU}/vo-6.mp3')
slide(7, f'{TK}/m-7.mp4', [(f'{ST}/dashboard.png', 1, 'zoom', None)], f'{AU}/vo-7.mp3')
slide(8, f'{TK}/m-8.mp4', [(f'{D}/guides-collage.png', 1, 'zoom', None)], f'{AU}/vo-8.mp3')
slide(9, f'{TK}/m-9.mp4', [(f'{ST}/claim.png', 1, 'zoom', None)], f'{AU}/{BRAND}-vo-9.mp3')
