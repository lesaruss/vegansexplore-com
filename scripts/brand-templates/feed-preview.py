# The week's feed view for Sean (Sean, 2026-11-15: feed posts and stories seen separately; never two cityscapes back to back): the
# Instagram grid, newest at top left, three across, each post's cover with its Eastern time and status (green Scheduled, pink Waiting).
# Reads the same slots JSON as stories-preview.py (et "Dy|HH12:MI AM", status, kind, title, url), feed posts only.
# Usage: python3 scripts/brand-templates/feed-preview.py slots.json "Instagram grid, week of Nov 23" out.jpg
import io, json, os, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont
rows, title, out = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ft, fl = ImageFont.truetype(F, 22), ImageFont.truetype(F, 14)
feed = [r for r in rows if r['kind'] != 'story'][::-1]
TW, TH, BAR, G = 300, 375, 26, 10
cols = 3; n = len(feed); rws = (n + cols - 1) // cols
im = Image.new('RGB', (cols * (TW + G) + G, 60 + rws * (TH + BAR + G)), 'white'); dr = ImageDraw.Draw(im)
dr.text((G, 18), title, font=ft, fill='#1a1a1a')
def pic(u):
    m = re.search(r'/media/social/(.+)$', u or '')
    if m:
        local = 'public/social/' + re.sub(r'-v\d+\.jpg$', '.jpg', m.group(1))
        if os.path.exists(local): return Image.open(local)
    return Image.open(io.BytesIO(urllib.request.urlopen(u).read()))
for i, r in enumerate(feed):
    x = G + (i % cols) * (TW + G); y = 56 + (i // cols) * (TH + BAR + G)
    im.paste(pic(r['url']).convert('RGB').resize((TW, TH)), (x, y))
    ok = r['status'] == 'scheduled'
    dr.rectangle([x, y + TH, x + TW, y + TH + BAR], fill='#2E5E2B' if ok else '#C2185B')
    d, t = r['et'].split('|')
    dr.text((x + 8, y + TH + 5), f"{d} {t.lstrip('0').replace(':00 ', ' ')} · {'Scheduled' if ok else 'Waiting'}", font=fl, fill='white')
im.save(out, quality=86); print('wrote', out, im.size)
