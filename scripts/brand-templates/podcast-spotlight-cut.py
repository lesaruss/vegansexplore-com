#!/usr/bin/env python3
# Cuts a podcast spotlight reel on the locked template (canon canon-ve-brand-kit-templates v3 podcast_spotlight_reel; Sean, 2026-11-19).
# The frame comes from podcast-spotlight-reel.js --layers; this script trims the interview's parts, plays them horizontal in the window,
# shows each caption over the city art on its words, then holds the end card.
#
#   python3 scripts/brand-templates/podcast-spotlight-cut.py spec.json out_dir
# spec (the renderer's spec plus): "source": the episode video, "parts": [[start, end], ...] in the episode's seconds,
#   "captions": [{"t0": .., "t1": .., "text": ".."}] in seconds of the cut (parts back to back), "end_s": end card seconds (default 3.5),
#   "music": a bed (vegan-media media/music/beds/), "music_vol" (default 0.14): under the voice, ducked by it, fading out with the end card,
#   "vtrim": {"<part index>": <episode second>} ends that part's picture early and holds its last frame (a camera cut at the edge),
#   "end_page": a 16:9 screenshot of their profile page, shown in the window with a slow push-in on the end frame (endbg.png),
#   "join": seconds of the dissolve between parts (default 0, a straight cut; 0.25 smooths a jump).
# The site must be served at http://localhost:8766 (python3 -m http.server 8766 from the repo root) for the renderer.
import json, os, subprocess, sys

spec_path, out = sys.argv[1], sys.argv[2]
S = json.load(open(spec_path))
os.makedirs(out, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
subprocess.run(['node', os.path.join(here, 'podcast-spotlight-reel.js'), '--spec', spec_path, '--out', out, '--layers'], check=True)
win = json.load(open(os.path.join(out, 'win.json')))
caps = S.get('captions', [])
END = float(S.get('end_s', 3.5))
FADE = 0.06

# 1) the parts back to back, each with a tiny audio fade so the joins do not click
inputs, fc, cat = [], [], ''
for i, (a, b) in enumerate(S['parts']):
    d = b - a
    inputs += ['-ss', str(a), '-t', str(d), '-i', S['source']]
    vt = (S.get('vtrim') or {}).get(str(i))
    hold = f',trim=0:{vt - a:.3f},tpad=stop_mode=clone:stop_duration={b - vt + 0.1:.3f},trim=0:{d:.3f}' if vt else ''
    fc.append(f'[{i}:v]setpts=PTS-STARTPTS{hold},fps=30,scale={win["w"]}:{win["h"]}:flags=lanczos,setsar=1[v{i}]')
    fc.append(f'[{i}:a]asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d={FADE},afade=t=out:st={d - FADE}:d={FADE}[a{i}]')
    cat += f'[v{i}][a{i}]'
n = len(S['parts'])
J = float(S.get('join', 0))
total = sum(b - a for a, b in S['parts']) - J * (n - 1)
if J > 0 and n > 1:
    lv, la, acc = 'v0', 'a0', S['parts'][0][1] - S['parts'][0][0]
    for i in range(1, n):
        fc.append(f'[{lv}][v{i}]xfade=transition=fade:duration={J}:offset={acc - J:.3f}[xv{i}]')
        fc.append(f'[{la}][a{i}]acrossfade=d={J}[xa{i}]')
        lv, la = f'xv{i}', f'xa{i}'; acc += S['parts'][i][1] - S['parts'][i][0] - J
    fc.append(f'[{lv}]null[cv]'); fc.append(f'[{la}]anull[ca]')
else:
    fc.append(f'{cat}concat=n={n}:v=1:a=1[cv][ca]')

# 2) the frame, the video in the window, the captions on their words
k = n
inputs += ['-loop', '1', '-framerate', '30', '-t', str(total), '-i', os.path.join(out, 'bg.png')]
fc.append(f'[{k}:v]format=rgba[bg]')
fc.append(f'[bg][cv]overlay={win["x"]}:{win["y"]}:shortest=1[m0]')
last = 'm0'
for j, c in enumerate(caps):
    inputs += ['-loop', '1', '-framerate', '30', '-t', str(total), '-i', os.path.join(out, f'cap-{j}.png')]
    fc.append(f"[{last}][{k + 1 + j}:v]overlay=0:0:enable='between(t,{c['t0']},{c['t1']})'[m{j + 1}]")
    last = f'm{j + 1}'

# 3) the end card, faded in over the last frame; the voice fades out under it
e = k + 1 + len(caps)
fc.append(f'[{last}]format=yuv420p[main]')
if S.get('end_page'):
    inputs += ['-loop', '1', '-framerate', '30', '-t', str(END + 0.5), '-i', os.path.join(out, 'endbg.png'),
               '-loop', '1', '-framerate', '30', '-t', str(END + 0.5), '-i', S['end_page']]
    nf = int((END + 0.5) * 30)
    fc.append(f"[{e + 1}:v]scale={win['w'] * 3}:{win['h'] * 3}:flags=lanczos,zoompan=z='1+0.06*on/{nf}':x='iw/2-(iw/zoom/2)':y='0':d=1:s={win['w']}x{win['h']}:fps=30,setsar=1[pg]")
    fc.append(f'[{e}:v][pg]overlay={win["x"]}:{win["y"]}:shortest=1,format=yuv420p[endv]')
    e += 1
else:
    inputs += ['-loop', '1', '-framerate', '30', '-t', str(END + 0.5), '-i', os.path.join(out, 'end.png')]
    fc.append(f'[{e}:v]format=yuv420p[endv]')
fc.append(f'[main][endv]xfade=transition=fade:duration=0.5:offset={total - 0.5:.3f}[vout]')
if S.get('music'):
    m = e + 1
    inputs += ['-stream_loop', '-1', '-i', S['music']]
    mv = float(S.get('music_vol', 0.14))
    fc.append(f'[ca]afade=t=out:st={total - 0.6:.3f}:d=0.6,apad=pad_dur={END},asplit=2[vo][sc]')
    fc.append(f'[{m}:a]aresample=48000,atrim=0:{total + END:.3f},volume={mv},afade=t=in:d=0.8,afade=t=out:st={total + END - 1.6:.3f}:d=1.6[bed]')
    fc.append('[bed][sc]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=400[bd]')
    fc.append('[vo][bd]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5[aout]')
else:
    fc.append(f'[ca]afade=t=out:st={total - 0.6:.3f}:d=0.6,apad=pad_dur={END},loudnorm=I=-16:TP=-1.5[aout]')

dst = os.path.join(out, S.get('out_name', 'reel.mp4'))
cmd = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc),
       '-map', '[vout]', '-map', '[aout]', '-t', f'{total + END:.3f}', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
       '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst]
subprocess.run(cmd, check=True)
print('wrote', dst, f'{total + END:.1f}s')
