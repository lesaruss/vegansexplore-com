# The week's stories view for Sean (Sean, 2026-11-15: feed posts and stories seen separately): one row per day, each story with its
# Eastern time and status under it (green Scheduled, pink Waiting). Reads the slots JSON written by this query (run through the
# Supabase connector and saved to a file):
#   select to_char(slot_at at time zone 'America/New_York','Dy|HH12:MI AM') et, status, assets->0->>'url' url from ve_social_slots
#   where brand_slug='vegans-explore' and kind='story' and status<>'skipped' and slot_at >= '<monday>' and slot_at < '<next monday>' order by slot_at;
# Pictures come from the repo when the url's path after media/social/ exists under public/social/ (the "-v2" suffix dropped), else from the url.
# Usage: python3 scripts/brand-templates/stories-preview.py slots.json "Stories, week of Nov 16" out.jpg
import io, json, os, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

rows, title, out = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ft, fd, fl = ImageFont.truetype(F, 22), ImageFont.truetype(F, 26), ImageFont.truetype(F, 13)
TW, TH, BAR, GAP, LEFT = 180, 320, 28, 14, 110
DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
by = {d: [r for r in rows if r['et'].split('|')[0] == d] for d in DAYS}
cols = max(1, max(len(v) for v in by.values()))
W, H = LEFT + cols * (TW + GAP) + 10, 70 + len(DAYS) * (TH + BAR + 26)
im = Image.new('RGB', (W, H), 'white'); dr = ImageDraw.Draw(im)
dr.text((20, 20), title, font=ft, fill='#1a1a1a')

def pic(u):
    m = re.search(r'/media/social/(.+)$', u or '')
    if m:
        local = 'public/social/' + re.sub(r'-v\d+\.jpg$', '.jpg', m.group(1))
        if os.path.exists(local): return Image.open(local)
    return Image.open(io.BytesIO(urllib.request.urlopen(u).read()))

y = 60
for d in DAYS:
    dr.text((20, y + TH // 2 - 14), d, font=fd, fill='#1a1a1a')
    for i, r in enumerate(by[d]):
        x = LEFT + i * (TW + GAP)
        im.paste(pic(r['url']).convert('RGB').resize((TW, TH)), (x, y))
        ok = r['status'] == 'scheduled'
        dr.rectangle([x, y + TH, x + TW, y + TH + BAR], fill='#2E5E2B' if ok else '#C2185B')
        t = r['et'].split('|')[1].lstrip('0').replace(':00 ', ' ') + ' · ' + ('Scheduled' if ok else 'Waiting')
        dr.text((x + 8, y + TH + 6), t, font=fl, fill='white')
    y += TH + BAR + 26
im.save(out, quality=86)
print('wrote', out, im.size)
