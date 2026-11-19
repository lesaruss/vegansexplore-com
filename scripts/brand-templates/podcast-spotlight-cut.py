#!/usr/bin/env python3
# Cuts a podcast spotlight reel on the locked template (canon canon-ve-brand-kit-templates v3 podcast_spotlight_reel; Sean, 2026-11-19).
# The frame comes from podcast-spotlight-reel.js --layers; this script trims the interview's parts, plays them horizontal in the window,
# shows each caption over the city art on its words, then holds the end card.
#
#   python3 scripts/brand-templates/podcast-spotlight-cut.py spec.json out_dir
# spec (the renderer's spec plus): "source": the episode video, "parts": [[start, end], ...] in the episode's seconds,
#   "captions": [{"t0": .., "t1": .., "text": ".."}] in seconds of the cut (parts back to back), "end_s": end card seconds (default 3.5).
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
    fc.append(f'[{i}:v]setpts=PTS-STARTPTS,fps=30,scale={win["w"]}:{win["h"]}:flags=lanczos,setsar=1[v{i}]')
    fc.append(f'[{i}:a]asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d={FADE},afade=t=out:st={d - FADE}:d={FADE}[a{i}]')
    cat += f'[v{i}][a{i}]'
n = len(S['parts'])
total = sum(b - a for a, b in S['parts'])
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
inputs += ['-loop', '1', '-framerate', '30', '-t', str(END + 0.5), '-i', os.path.join(out, 'end.png')]
fc.append(f'[{last}]format=yuv420p[main]')
fc.append(f'[{e}:v]format=yuv420p[endv]')
fc.append(f'[main][endv]xfade=transition=fade:duration=0.5:offset={total - 0.5:.3f}[vout]')
fc.append(f'[ca]afade=t=out:st={total - 0.6:.3f}:d=0.6,apad=pad_dur={END},loudnorm=I=-16:TP=-1.5[aout]')

dst = os.path.join(out, S.get('out_name', 'reel.mp4'))
cmd = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc),
       '-map', '[vout]', '-map', '[aout]', '-t', f'{total + END:.3f}', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
       '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst]
subprocess.run(cmd, check=True)
print('wrote', dst, f'{total + END:.1f}s')
