# Full v3 render: 25 still frames, 0.4 s crossfades, no zoom, V's lines on the chapter timeline, beds at -15 dB, loudnorm -15.
# usage: python3 render.py <frames dir> <audio dir> <out.mp4>   (audio dir: t1..t11.mp3, bed.mp3 = story-dining-v2, bed2.mp3 = story-playful-v2)
import json, subprocess, sys
F, A, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
D = [15.4645, 11.7029, 9.8743, 11.9641, 10.3967, 9.3257, 12.4865, 8.96, 7.1053, 22.1518, 6.3478]
O = [0.5]
for d in D[:-1]: O.append(O[-1] + d + 0.45)
END = O[-1] + D[-1] + 1.2
X = 0.4
S = json.load(open('shots.json'))
starts = [0.0] + [O[s[0]-1] + s[1] for s in S[1:]]
durs = [b - a for a, b in zip(starts, starts[1:] + [END])]
inp, fl = [], []
for i, d in enumerate(durs):
  inp += ['-loop', '1', '-t', f'{d + (X if i < len(durs)-1 else 0):.3f}', '-framerate', '30', '-i', f'{F}/v3-{i+1:02d}.jpg']
  fl.append(f'[{i}:v]scale=1080:1350,setsar=1,format=yuv420p[s{i}]')
prev, off = 's0', 0.0
for i in range(1, len(durs)):
  off += durs[i-1]
  fl.append(f'[{prev}][s{i}]xfade=transition=fade:duration={X}:offset={off:.3f}[x{i}]'); prev = f'x{i}'
fl.append(f'[{prev}]fade=t=in:st=0:d=0.5:color=white,fade=t=out:st={END-0.8:.3f}:d=0.8:color=white[v]')
n = len(durs)
for k in range(11):
  inp += ['-i', f'{A}/t{k+1}.mp3']
  ms = round(O[k]*1000); fl.append(f'[{n+k}:a]aresample=48000,adelay={ms}|{ms}[l{k}]')
# Bed: story-dining for the first half, a 4 s crossfade at chapter 6 into story-playful (steady to the end), both under V at -15 dB.
SW = O[5] - 2.0
inp += ['-i', f'{A}/bed.mp3', '-i', f'{A}/bed2.mp3']
b = n + 11
fl.append(f'[{b}:a]aresample=48000,atrim=4:{SW+6:.3f},asetpts=PTS-STARTPTS[b1]')
fl.append(f'[{b+1}:a]aresample=48000,volume=1dB,atrim=0:{END-SW+2:.3f}[b2]')
fl.append(f'[b1][b2]acrossfade=d=4[bb]')
fl.append(f'[bb]atrim=0:{END:.3f},volume=-15dB,afade=t=in:d=0.4,afade=t=out:st={END-2.5:.3f}:d=2.5[bed]')
fl.append(''.join(f'[l{k}]' for k in range(11)) + f'[bed]amix=inputs=12:normalize=0:duration=longest,atrim=0:{END:.3f},loudnorm=I=-15:TP=-1.5:LRA=11[a]')
cmd = ['ffmpeg', '-y', *inp, '-filter_complex', ';'.join(fl), '-map', '[v]', '-map', '[a]', '-t', f'{END:.3f}',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
       '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', OUT]
print(f'end {END:.2f}s, {n} frames'); subprocess.run(cmd, check=True)
