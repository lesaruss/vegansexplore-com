# Two-layer cut: only the picture zooms; the shade, words and bar sit still on top.
set -e
FPS=30; i=0; : > list2.txt
while read name start end; do
  n=$(python3 -c "print(max(1,round(($end-$start)*$FPS)))")
  ffmpeg -nostdin -hide_banner -loglevel error -y -loop 1 -i bg-$name.png -loop 1 -i ov-$name.png -filter_complex \
   "[0]scale=3240:4950:flags=lanczos,zoompan=z='1+0.05*on/$n':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$n:s=1080x1650:fps=$FPS,pad=1080:1920:0:0:white[b];[b][1]overlay=0:0:shortest=1,format=yuv420p" \
   -frames:v $n -r $FPS L$i.mp4
  echo "file 'L$i.mp4'" >> list2.txt; i=$((i+1))
done <<SHOTS
a-kai 0.0 2.0
b-philly 2.0 5.3
c-cover 5.3 7.4
d-kj 7.4 9.6
e-market 9.6 13.2
f-river 13.2 15.8
g-potluck 15.8 17.1
h-shows 17.1 18.3
i-cast 18.3 20.4
j-points 20.4 23.2
k-founding 23.2 26.1
c-cover 26.1 28.3
SHOTS
ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i list2.txt -i kai.mp3 -i music.mp3 -filter_complex "[1]aresample=48000,asplit=2[v][sc];[2]aresample=48000,volume=0.16,afade=t=in:d=0.8,afade=t=out:st=26.6:d=1.6[m];[m][sc]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=400[md];[v][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5[a]" -map 0:v -map "[a]" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -shortest -movflags +faststart kj-reel-v4.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 kj-reel-v4.mp4
